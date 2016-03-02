/**
 * Utility functions
 *
 * @flow
 */

const createWhiteSpace = (num: number): string => {
    let txt = "";
    for (; txt.length < num;) {
        txt += " ";
    }
    return txt;
};

export const indentedLines = (
    parts: Array<string>,
    joiner: string = "\n",
    num: number = 1
): string => {
    // Need to re-split to account for multi-line parts
    const lines = parts.join(joiner).split(/\n/g);
    return [lines[0]].concat(lines.slice(1).map(
        line => line === "" ? "" : createWhiteSpace(num * 2) + line
    )).join("\n");
};

// TODO(jared): once flow knows about `Object.values` (which babel polyfills
// for us) we can remove this function
export const listValues = function<T>(object: {[key: string]: T}): Array<T> {
    return Object.keys(object).map(key => object[key]);
};

export const capitalize = (txt: string): string =>
    txt[0].toUpperCase() + txt.slice(1);
