define(["vendor/mithril"], function(mDiscard) {

    "use strict"
    
    // This constructs a nested Mithril object with only specific HTML tags allowed
    // No attributes are allowed.
    // A css class (from a short approved list) can be set on a tag using a ".className" after the opening tag name.
    // For example: <span.narrafirma-special-warning>Warning!!!<span>
    
    const debugLogging = false
    
    // 1 is normal tag that needs to be closed; 2 is self-closing tag (br and hr)
    const allowedHTMLTags = {
        // a: 1,
        address: 1,
        article: 1,
        b: 1,
        big: 1,
        blockquote: 1,
        br: 2,
        caption: 1,
        cite: 1,
        code: 1,
        del: 1,
        div: 1,
        dd: 1,
        d1: 1,
        dt: 1,
        em: 1,
        h1: 1,
        h2: 1,
        h3: 1,
        h4: 1,
        h5: 1,
        h6: 1,
        hr: 2,
        i: 1,
        // img
        kbd: 1,
        li: 1,
        ol: 1,
        p: 1,
        pre: 1,
        s: 1,
        small: 1,
        span: 1,
        sup: 1,
        sub: 1,
        strong: 1,
        strike: 1,
        table: 1,
        td: 1,
        th: 1,
        tr: 1,
        u: 1,
        ul: 1
    }
    
    const allowedCSSClasses = {
        "narrafirma-special-warning": 1
    }
    
    function isURLAcceptable(url, configuration) {
        if (!url) return ""
        if (url.substring(0, 5) === "http:" || url.substring(0, 6) === "https:") return url
        if (url.startsWith("#") && isIdAllowed(url.substring(1), configuration)) return url
        if (configuration.baseURL) return configuration.baseURL + url
        return ""
    }
    
    function isTagAllowed(tagName, configuration) {
        if (allowedHTMLTags[tagName]) return true
        
        if (!configuration) configuration = {}
        
        if (tagName === "a" && configuration.allowLinks) return true
        if (tagName === "img" && configuration.allowImages) return true
        return false
    }
    
    function isIdAllowed(id, configuration) {
        return configuration.allowIds && !/[^a-zA-Z0-9_-]/.test(id)
    }
    
    function generateVDOM(nodes, configuration) {
        if (!nodes) return []
        // console.log("generateVDOM nodes length", nodes.length)
      
        const result = []
        
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            // console.log("nodeType", node.nodeType)
    
            switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                let tagName = node.tagName.toLowerCase()
                
                if (tagName === "style") continue
                
                // console.log("element", node)
                if (!isTagAllowed(tagName, configuration)) {
                    if (debugLogging) console.log("disallowed tag", tagName)
                    tagName = "span"
                }
                
                // TODO: Allow more attributes maybe
                let attributes = {}
                for (let j = 0; j < node.attributes.length; j++) {
                    const attribute = node.attributes[j]
                    if (attribute.name === "class") {
                        const theClassOrClasses = attribute.value
                        if (theClassOrClasses in allowedCSSClasses) {
                            attributes["class"] = theClassOrClasses
                        } else {
                            if (debugLogging) console.log("WARN: CSS class not allowed", theClassOrClasses)
                        }
                    }
                    if (configuration.allowIds && attribute.name === "id") {
                        const theId = attribute.value
                        if (isIdAllowed(theId, configuration)) {
                            attributes["id"] = theId
                        } else {
                            if (debugLogging) console.log("WARN: CSS id not allowed", theId)
                        }
                    }
                    if (configuration.allowLinks && attribute.name === "href") {
                        let url = attribute.value
                        if (url && url.substring(0, 2) === "//") {
                            url = window.location.protocol + url
                        }
                        const usableURL = isURLAcceptable(url, configuration)
                        if (usableURL) {
                            attributes["href"] = usableURL
                        }
                    }
                    if (configuration.allowImages && attribute.name === "src") {
                        let url = attribute.value
                        if (url && url.substring(0, 2) === "//") {
                            url = window.location.protocol + url
                        }
                        const usableURL = isURLAcceptable(url, configuration)
                        if (usableURL) {
                            attributes["src"] = usableURL
                        }
                    }
                    if (configuration.allowImages && (attribute.name === "width" || attribute.name === "height")) {
                        const size = parseInt(attribute.value)
                        if (!isNaN(size) && size > 1) {
                            attributes[attribute.name] = size
                        } else {
                            // Tracking image
                            console.log("discarding likely tracking image")
                            tagName = "span"
                            attributes = {}
                            break
                        }
                    }                    
                }
                
                if (tagName === "a" && attributes["href"] && !attributes["href"].startsWith("#")) {
                    attributes["rel"] = "nofollow"
                    attributes["target"]  = "_blank"
                }
                
                if (tagName === "img") {
                    if (attributes["width"] === 0 || attributes["width"] === 1 || attributes["height"] === 0 || attributes["height"] === 1) {
                        console.log("discarding likely tracking image (2)", attributes["src"])
                        tagName = "span"
                        attributes = {}
                    }
                }
                
                const children = generateVDOM(node.childNodes, configuration)
                const vdom = m(tagName, attributes, children)
                result.push(vdom)
                break
            case Node.TEXT_NODE:
                if (node.data) {
                    // console.log("adding text node", node.data)
                    result.push(node.data)
                }
                break
            case Node.PROCESSING_INSTRUCTION_NODE:
            case Node.COMMENT_NODE:
            case Node.DOCUMENT_NODE:
            case Node.DOCUMENT_TYPE_NODE:
            case Node.DOCUMENT_FRAGMENT_NODE:
                // Discard these Node types
                break
            default:
                console.log("WARN: Unhandled node type", node.nodeType, node)
            }
        }
        
        return result
    }
    
    function generateSanitizedHTMLForMithrilWithAttributes(mithril, DOMParser, html, configuration = {}) {
        m = mithril
        // console.log("generateSanitized html", html)
    
        if (html === undefined || html === null) {
            console.log("generateSanitizedHTMLForMithrilWithAttributes: Undefined or null html", html)
            html = ""
            // throw new Error("Undefined or null html")
        }
        
        // Handle case where is already a Mithril object
        if (html.tag) return html
        
        const hasMarkup = html.indexOf("<") !== -1
        // console.log("has markup", hasMarkup)
        if (!hasMarkup) return html
        
        const htmlDoc = new DOMParser().parseFromString(html, "text/html")
        
        // console.log("htmlDoc", htmlDoc)
        
        const vdom = generateVDOM(htmlDoc.childNodes, configuration)
        
        // console.log("generateSanitizedHTMLForMithrilWithAttributes vdom", vdom)
        
        return vdom
    }
    
    function generateSanitizedHTMLForMithrilWithoutAttributes(mithril, html) {
        m = mithril
        // console.log("html", html)
        
        if (html === undefined || html === null) {
            console.log("Undefined or null html", html)
            html = ""
            // throw new Error("Undefined or null html")
        }
        
        // Handle case where is already a Mithril object
        if (html.tag) return html
        
        const hasMarkup = html.indexOf("<") !== -1
        // console.log("has markup", hasMarkup)
        if (!hasMarkup) return html
        
        try {
            // Use a fake div tag as a conceptual placeholder
            const tags = [{tagName: "div", cssClass: undefined}]
            const output = [[]]
            let text = ""
            
            for (let i = 0, l = html.length; i < l; i++) {
                let tagDisallowed = false
                const c = html.charAt(i)
        
                if (c === "<") {
                    if (text !== "") {
                        output[output.length - 1].push(text)
                        text = ""
                    }
                    
                    let closing = html.charAt(i + 1) === "/"
                    if (closing) i++
                    
                    // Simple approach will cause parse errors ">" in parameter strings, but OK
                    const pos = html.indexOf(">", i + 1)
                    if (pos < 0) {
                        throw new Error("no closing angle bracket found after position: " + i)
                    }
                    let tagEnd = pos
                    const spacePos = html.indexOf(" ", i + 1)
                    if (spacePos > -1 && spacePos < pos) tagEnd = spacePos
                    let tagName = html.substring(i + 1, tagEnd)
                    i = pos
                    
                    const closedTag = html.substring(pos - 1, pos) === "/"
                    
                    // console.log("tagName", tagName, closedTag)
                    
                    // Special support for Mithril-like class names inline with tags
                    let cssClass
                    const parts = tagName.split(".")
                    if (parts.length > 1) {
                        tagName = parts[0]
                        cssClass = parts[1]
                    } else {
                        cssClass = undefined
                    }
                    
                    if (/[^A-Za-z0-9]/.test(tagName)) {
                        throw new Error("tag is not alphanumeric or has attributes: " + tagName)
                    }
                    
                    if (cssClass && !allowedCSSClasses[cssClass]) {
                        throw new Error("css class is not allowed: " + cssClass)
                    }
                    
                    if (closing) {
                        const startTag = tags.pop()
                        if (startTag.tagName !== tagName) {
                            throw new Error("closing tag does not match opening tag for: " + tagName)
                        }
                        cssClass = startTag.cssClass
                    }
                    
                    if (!allowedHTMLTags[tagName]) {
                        // throw new Error("tag is not allowed: " + tagName)
                        tagDisallowed = true
                        // tagName = "span"
                    }
                    
                    if (allowedHTMLTags[tagName] === 2) {
                        // self-closing tag like BR
                        output.push([])
                        closing = true
                    }
                    
                    if (closedTag) output.push([])
                    
                    if (closing || closedTag) {
                        let newTag
                        if (tagDisallowed) tagName = "span"
                        if (cssClass) {
                            newTag = m(tagName, {"class": cssClass}, output.pop())
                        } else {
                            newTag = m(tagName, output.pop())
                        }
                        output[output.length - 1].push(newTag)
                    } else {
                        tags.push({tagName: tagName, cssClass: cssClass})
                        output.push([])
                    }
                } else {
                    text = text + c
                }
            }
            
            if (text) output[output.length - 1].push(text)
            
            if (tags.length !== 1 || output.length !== 1) {
                const unmatched = tags.pop()
                throw new Error("Unmatched start tag: " + unmatched.tagName)
            }
            
            // Don't return the fake div tag, just the contents
            return output.pop()
        } catch (exception) {
            return [m("div", "Strict sanitization issue: " + exception)]
        }
    }
    
    return {
        generateSanitizedHTMLForMithrilWithAttributes,
        generateSanitizedHTMLForMithrilWithoutAttributes
    }
})
