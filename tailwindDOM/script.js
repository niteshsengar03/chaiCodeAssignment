const utilityMap = {
    // Spacing
    p: { property: "padding", type: "spacing" },
    m: { property: "margin", type: "spacing" },

    // Colors
    bg: { property: "background", type: "color" },
    text: { property: "color", type: "color" },

    // Typography
    fs: { property: "font-size", type: "spacing" },
    ta: { property: "text-align", type: "keyword" },

    // Borders
    b: { property: "border-width", type: "spacing" },
    br: { property: "border-radius", type: "spacing" },
    bs: { property: "border-style", type: "keyword" },

    // Layout
    d: { property: "display", type: "keyword" },
    jc: { property: "justify-content", type: "keyword" },
    ai: { property: "align-items", type: "keyword" },
    gap: { property: "gap", type: "spacing" },

    // Size
    w: { property: "width", type: "spacing" },
    h: { property: "height", type: "spacing" },

    // Misc
    cursor: { property: "cursor", type: "keyword" },
    op: { property: "opacity", type: "keyword" }
};

const colorMap = {

    red: "#ef4444",
    red500: "#ef4444",
    red600: "#dc2626",


    blue: "#3b82f6",
    blue500: "#3b82f6",
    blue600: "#2563eb",


    green: "#22c55e",
    green500: "#22c55e",
    green600: "#16a34a",

  
    gray: "#6b7280",
    gray500: "#6b7280",
    gray700: "#374151",
    gray900: "#111827",


    white: "#ffffff",
    black: "#000000",

    yellow: "#eab308",
    purple: "#a855f7",
    pink: "#ec4899"
};



const a = document.querySelectorAll('[class]');
// console.log(a);
a.forEach(myfunction);
function myfunction(element) {
    // console.log(element.classList);
    element.classList.forEach((ele) => {
        // console.log(typeof ele)
        console.log(ele);
        if (ele.startsWith("chai-")) {
            // console.log(ele);
            const arr = ele.split("-");
            // console.log(arr);
            if (arr.length === 3) {
                const utility = (arr[1]);
                const value = (arr[2]);
                if (Object.hasOwn(utilityMap, utility)) {
                    const property = utilityMap[utility].property;
                    const type = utilityMap[utility].type
                    // console.log(property, type);
                    let finalValue;
                    if (type === "spacing") {
                        if (!isNaN(Number(value)))
                            finalValue = value + "px"
                        else return;
                    } else if (type === "color") {
                        if (value.startsWith("#")) {
                            finalValue = value;
                        }
                        else if (Object.hasOwn(colorMap, value)) {
                            finalValue = colorMap[value];
                        }
                        else {
                            finalValue = value; // allows "red", "blue" if browser supports
                        }

                    } else if (type === "keyword") {
                        finalValue = value;
                    }
                    element.style[property] = finalValue;
                }
            }
        }
    });
}