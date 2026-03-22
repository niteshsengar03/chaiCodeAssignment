
// - property → actual CSS property
// - type → how to process the value
//   - "spacing" → numeric → add "px"
//   - "color"   → use value directly
//   - "keyword" → use value directly (like flex, center, block)




const utilityMap = {
    // Spacing padding and margin
    p: {
        property: "padding",
        type: "spacing",
    },
    m: {
        property: "margin",
        type: "spacing",
    },

    // Colors background color and text color
    bg: {
        property: "background",
        type: "color",
    },
    text: {
        property: "color",
        type: "color",
    },

    // Typography fontsize and textalign
    fs: {
        property: "font-size",
        type: "spacing",
    },
    ta: {
        property: "text-align",
        type: "keyword",
    },

    // Borders
    b: {
        property: "border-width",
        type: "spacing",
    },
    br: {
        property: "border-radius",
        type: "spacing",
    },

    // Layout  flex
    d: {
        property: "display",
        type: "keyword",
    }
}

const a = document.querySelectorAll('[class]');
a.forEach(myfunction);
function myfunction(element) {
    element.classList.forEach((ele) => {
        // console.log(typeof ele)
        if (ele.startsWith("chai-")) {
            const arr = ele.split("-");
            if (arr.length === 3) {
                const utility = (arr[1]);
                const value = (arr[2]);
                if (Object.hasOwn(utilityMap, utility)) {
                    const property = utilityMap[utility].property;
                    const type = utilityMap[utility].type
                    console.log(property, type);
                    let finalValue;
                    if (type === "spacing") {
                        if (!isNaN(Number(value)))
                            finalValue = value + "px"
                        else return;
                    } else if (type === "color") {
                        finalValue = value;
                    } else if (type === "keyword") {
                        finalValue = value;
                    }
                    element.style[property] = finalValue;
                }
            }
        }
    });
}