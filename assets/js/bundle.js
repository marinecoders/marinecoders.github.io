(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.generatorBundle = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (Buffer){
const docx = require("docx");


module.exports = {
    generateDoc: generate,
    addVia: AddViaTextBox,
    addRef: AddRefTextBox,
    addEnc: AddEnclTextBox,
    addBody: AddBodyTextBox,
    addCopy: AddCopyTextBox,
    showHideDiv: ShowHideDiv,
    removeVia: RemoveViaTextBox,
    removeEnc: RemoveEnclTextBox,
    removeRef: RemoveRefTextBox,
    removeBody: RemoveBodyTextBox,
    removeCopy: RemoveCopyTextBox
}

function generate() {
    var filename = document.getElementById("filename").value;
    if (filename === "") {
        filename = "NavalLetterGeneratedFile.docx";
    }
    if (!filename.endsWith(".docx")) {
        filename = filename + ".docx";
    }

    const doc = new docx.Document();

    var section = {
        properties: {},
        children: [],
        margins: {
            top: "1in",
            bottom: "1in",
            right: "1in",
            left: "1in",
        }
    };

    section.headers = {
        default: new docx.Header({
            children: makeHeaderEntities(doc,
                document.getElementById("line1").value,
                document.getElementById("line2").value,
                document.getElementById("line3").value
            ),
        }),
    };

    // document content
    section.children.push.apply(section.children, makeHeaderSection(
        document.getElementById("ssic").value,
        document.getElementById("reply").value,
        document.getElementById("date").value
    ));
    section.children.push.apply(section.children, makeReplyBlock(
        document.getElementById("from").value,
        document.getElementById("to").value,
        document.getElementById("subj").value,
        //Get Vias, there can be multiple vias
        document.getElementsByName("ViaTextBox"),
        //Get Refs, there can be multiple refs
        document.getElementsByName("RefTextBox"),
        //Get Enclosures, there can be multiple encls.
        document.getElementsByName("EnclTextBox")
    ));

    // references, enclosures, vias here
    bodyTexts = Array.from(document.querySelectorAll('[id=BodyBlocks]'));
    bodyLevels = Array.from(document.querySelectorAll('[id=BodyLevel]'));
    section.children.push.apply(section.children, makeBodies(bodyTexts, bodyLevels));

    section.children.push.apply(section.children, makeSignatureSection(document.getElementById("sig").value));

    // copy to's here
    doc.addSection(section);

    docx.Packer.toBlob(doc).then(blob => {
        saveAs(blob, filename);
        console.log("document downloaded");
    });
}

function makeTextRun(text, font, size) {
    return new docx.TextRun({
        text: text,
        font: font,
        size: size,
    });
}

function makeDefaultTextRun(text) {
    return new docx.TextRun({
        text: text,
        font: "Times New Roman",
        size: 24,
    });
}

function makeSignatureSection(sig) {
    paragraphs = [];
    // two returns (body paragaph will leave one return above)
    paragraphs.push(new docx.Paragraph({ text: "" }));
    paragraphs.push(new docx.Paragraph({ text: "" }));
    paragraphs.push(new docx.Paragraph({
        children: [makeDefaultTextRun(sig)],
        indent: {
            start: "3.25in",
        },
    }));
    return paragraphs;
}

function makeBodies(bodyTexts, bodyLevels) {
    bodyZipped = bodyTexts.map(function (e, i) {
        return [e, bodyLevels[i]];
    });

    paragraphs = [];
    topLevelNum = 1;
    midLevelNum = 97;
    botLevelNum = 1;
    bodyZipped.forEach(element => {
        var selector = element[1];
        var level = selector.options[selector.selectedIndex].value;
        if (level === "1") {
            var start = topLevelNum.toString() + ".  ";
            makeBodyPara(paragraphs, start, element[0].value);
            // update indenting
            topLevelNum++;
            midLevelNum = 97;
            botLevelNum = 1;
        } else if (level == "2") {
            var start = "       " + String.fromCharCode(midLevelNum) + ".  ";
            makeBodyPara(paragraphs, start, element[0].value);
            // update indenting
            midLevelNum++;
            botLevelNum = 1;
        } else if (level == "3") {
            var start = "             (" + botLevelNum.toString() + ") ";
            makeBodyPara(paragraphs, start, element[0].value);
            // update indenting
            botLevelNum++;
        }
    });
    return paragraphs;
}

function makeBodyPara(paragraphs, start, value) {
    var para = new docx.Paragraph({
        children: [makeDefaultTextRun(start + value)],
    });
    paragraphs.push(para);
    paragraphs.push(new docx.Paragraph({ text: "" }));

}

function makeReplyBlock(from, to, subj, vias, refs, encls) {
    var output = [];
    

    output.push(new docx.Paragraph({ children: [makeDefaultTextRun("From:      " + to)], }));
    output.push(new docx.Paragraph({ children: [makeDefaultTextRun("To:      " + to)], }));

    //Add Vias
    //Check if via yes box is checked
    if (document.getElementById("rad1").checked) {
        console.log("Num vias detected: " + vias.length );
        for (i = 0; i < vias.length; i++) { //Add a via line for every via Box
            if(vias.length == 1) {//If only 1 via, no numbers
                output.push(new docx.Paragraph({ children: [makeDefaultTextRun("Via:     " + vias[i].value)], }));
            }
            else if(vias.length > 1) {//2 or more vias, add numbers
                if(i == 0) { 
                    output.push(new docx.Paragraph({ children: [makeDefaultTextRun("Via:     (" + (i+1) + ") " + vias[i].value)], }));
                } else {
                output.push(new docx.Paragraph({ children: [makeDefaultTextRun("(" + (i+1) + ") " + vias[i].value)], 
                    indent: {
                        start: ".5in",
                    }
            }));
                }
            }
        }
    }
    //Add Refs
    //Check if refs yes box is checked
    if (document.getElementById("rad3").checked) {
        console.log("Num refs detected: " + refs.length );
        for (i = 0; i < refs.length; i++) { //Add a via line for every via Box
            var outputLetterBlock;

            if(i < 26) {
                var letter = String.fromCharCode(i+97); //Add 97 to get to ASCI code a, which is (97)
                outputLetterBlock = "(" + letter + ")";
            }
            if(i >= 26) {
                var column = Math.floor(i / 26); 
                var remainder = i % 26;
                var letter = String.fromCharCode(remainder+97); //Add 97 to get to ASCI code a, which is (97)
                outputLetterBlock = "(";
                for(y = 0; y < column; y++) {
                    outputLetterBlock += "a";
                }
                outputLetterBlock += letter + ")"
            }
            if(i == 0) { 
                output.push(new docx.Paragraph({ children: [makeDefaultTextRun("Ref:    " + outputLetterBlock + refs[i].value)], }));
            } else {
            output.push(new docx.Paragraph({ children: [makeDefaultTextRun(outputLetterBlock + refs[i].value)], 
                indent: {
                    start: ".5in",
                }
        }));
            }
        }
    }
    

    //Add enclosures
    //Check if encls  yes box is checked
    if (document.getElementById("rad5").checked) {
        console.log("Num encls detected: " + encls.length );
        output.push(new docx.Paragraph({ text: "" }));
        for (i = 0; i < encls.length; i++) { //Add a via line for every via Box
            if(i == 0) { 
                output.push(new docx.Paragraph({ children: [makeDefaultTextRun("Encl:   (" + (i+1) + ") " + encls[i].value)], }));
            } else {
            output.push(new docx.Paragraph({ children: [makeDefaultTextRun("(" + (i+1) + ") " + encls[i].value)], 
                indent: {
                    start: ".5in",
                }
        }));
            }
        }
    }

    output.push(new docx.Paragraph({ text: "" }));
    output.push(new docx.Paragraph({ children: [makeDefaultTextRun("Subj:   " + subj.toUpperCase())], }));
    output.push(new docx.Paragraph({ text: "" }));
    
    return output;
}

function makeHeaderSection(ssic, replyCode, date) {
    return [
        new docx.Paragraph({ text: "" }),
        new docx.Paragraph({
            children: [makeTextRun("IN REPLY REFER TO:", "Times New Roman", 10)],
            indent: {
                start: "5.19in",
            }
        }),
        new docx.Paragraph({
            children: [makeDefaultTextRun(ssic)],
            indent: {
                start: "5.19in",
            }
        }),
        new docx.Paragraph({
            children: [makeDefaultTextRun(replyCode)],
            indent: {
                start: "5.19in"
            }
        }),
        new docx.Paragraph({
            children: [makeDefaultTextRun(date)],
            indent: {
                start: "5.19in"
            }
        }),
        new docx.Paragraph({ text: "" }),
    ];
}

function makeHeaderEntities(doc, line1, line2, line3) {
    // return a list
    entities = [];
    const image = docx.Media.addImage(doc, Buffer("/9j/2wCEAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRQBAwQEBQQFCQUFCRQNCw0UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFP/AABEIALwAtgMBIgACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AP1TooooAKKKKACiik6CgBaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAjXH4UuK5/xF4x07w1HGlzLJJdyq3kWcEe+ebH91P8A2b7tfJ/xb/bmsdP1j/hG/Ccd34s8VuzKvhzwZH9sukx18+62skf+0sas3+3XVhcDXxkuSjFv8l6vZL1IlOMD651rxRpHhmDz9W1K00+Jz8rXMyx7v93P3vwrkNc+NuhaJb/aCl5Nb/8APd41tYh/teZcPGrL/u5r85vhn8XviF+0h8VtY8K3HjXT/gnrlgJV+zPp73mrzbFZpF+1Tksu3b821k/3K5/xp+zP4g8NeG/iZP8AEjTr74ja5ZaLLrXh7xtPrFzPYXMQ2eau1T8siq3mLub/AMdr66lw3SpVfY47EKM/dfLFXdpO2jfLF+dpMx9vpzRifc+tft3/AA20SQLP4l8LwkffV9fSV0/4DBHLXNSf8FJfhd/D4s8Oc/8ATS//APkSvjT9lTxZ4Y8c+B/iPZWfw48J2OreF/Ba3dhe3WmR3l1NeRRt5txJ5oO/c3zbf4a+PfiR41/4WL4tu/EH9kaX4fku44RLZaPAILYOkaozJGOF3Fd21fWvq8DwfgcRiKuHqqa5LXfNHqk1pZ9P7xhKvKPbU/afRP2/vhpq7BU8U+FHLeusvbt/5HgRf/Hq9U8L/H7w14rt/NsTJfxf89tLki1Bf/JZ3b/x2vxq/YY+DXhX4xfFfVB42DTeHNA0e41i7s0do/tXl7RtZl5C/NubFej6fofhf4yfs8/FD4n+FfC9v8MNd8E3qDS7zw9PNb/abR8boZvnIaTb/EtcGP4VwFKu8PSqSVuRNtJpObtFbp+tloXHESf2f6R+v2h+MNC8SSvFpup29zcr9+28zbMn+9E2GX8RW9kjrX5KfBnxB8XJvgZoHxBHxK0TVLS4v5NMt9G+IoWNpp0b5Vs77O/5lX+8vzx17V8Of2/28O+M5fBHxFtp/h94jttqzWHiW4+1WO87WVVvFXzI9ytuDy+an+3XyuK4bxNKc1QkqnI2mo76aPR2bt5XRrCtH7Wh+gtJiuO8JfEnS/FZgiXNlfTJvS2nkU+cn9+F1JSVP9pCa7EnFfKyjy/EdAtFFFABRRRQAUUUUAFFFFABRRRQBHgAevvXhXx4/ac8N/CHQJ7y81mDTbWJmhl1KQeZmQdYbaL/AJbzf+OL/E1c/wDtT/tMaX8KvDNwGN5cI9z/AGclrpxYXWp3bf8ALnA652f7cv8AD91fnr4M8O674c1r9oWXSf2p/CeqWOr30KWmj2DyLb6Ro9rKv7lVWNt33m2+YG+Rgd3zfc+rybJJYuDxNeL9nFN2jZzlbflTeturOerV5PdjubPxG8X/ABQ/aR+BXj/4kaBfT+G/htpzNCmnW0n2jV9ZdGRXa8lVh+7VW3sq/Iv8Kfx1ofskeJvDXxp+AviHwunhm40fWvCNzDq0+keBN1neeI7EAhoZXZ90rbvvfN/zzruJPip8NP2S/Duj6F4V8SXkOlWniqf/AISLwrr9sxvUs5rYq8axYHmLujRlb51/eff215v8Lv2fPFPxD8T6xd+ANJv/AIKeBPFMSf8AEvjk+0a1f2gZmym7H2aFt33mZE/1f36+75qSwc4Sj7CkpKVOTTjonazXxSk0r3XNv8UTn+33dtTyi30FPgB8fPAPjTxP4ruL6/m1O5u7/TJ9t9q0NtG2yCOeNZD+8nhbbtZvlr1T4eaz8bNFufEWj/DXwvqFv8Jtejlhs9J+I8kVukKTKwZoNzqyr83yqm6vtj4G/sSeD/g5aObGzjsbqXiW7gkM9/N/vXTqGX/djVK9Ys9U8F+CbXRbmzjt1sdVma2i1aPa6lgjv+8mY7v4Hrw8fxTSqz5adFVNEryWmjbVorZq+juaRoedvQ/OP4FfsefHT4Yadef8I54z0vw8dU+S6n07QJdQkkXp5fmvAF2/7O7bWZef8EqfE+qXD31x4ruzc3EjSysnhwKu5uW+Xzxt/wC+a/R3WvjhbaXoeqX8dm7rG7f2bLh5Ib6NV3NJuVfl+6/5VoX/AMUfs119pTTL3+xrMtFeO8DfaPNZlEaxxZ3N/wB88+ZHtrzP9bM2VWVWHLFy3ahG7ttd2uy/q8D82PCn7AXxW+CPidPEXg/xbFFfwxNC6XuiXK29zC/Dwy7RIrRsv3t1c58U/AXx51DwXaeArbwjoFp4CS5W7v8ATfhvs33jb8szxO5lZuPlVl29K/TbRPjW+qaVPKNHuH1FpLl7O2SCRUkginaPe8u0qrfL8y10ceueD/iFqE+lbLPXDFbLcSuY1kjiUsybWb+Ftyv8vtVx4rxzqqtiqcZtPdxs9NtrbX0D2Efss/Jf44/tV6d4a+GXhv4d/D6wvNM0Wx0CfRrzRPFGmCHULO6d/mvFbBAkZWkX5W/5aPXx1ruv6j4p1SbU9WvZ9R1Cbb5tzO+53woC5/4CtfvH8Sf2X/A/xq8MxZtrDXtOuIT9n/tD/SAiH/nhdKfOi/4CzL/sV+c3x+/4JueIPAd9Jc+DftOpxszOuhX237TIq/M32adQEn+X+Hasv+xX3nDfEWVKPsJx9nUbbbk73bd372n4nHVpT+Lc4f8AYw8a/F2PV9U07wFF/wAJVpemW39p3fhK+lfZNErKGa1b/llN83ysrK3+9X6Y/s8ftbaD8RrS7tpL27S409gl9p+sJ5ep6Oem25XA8yPP/Ldf+B18UeA7FJf2d77wR+zbp+oal4z1+58nxjNqtxDa6tpkS8LHsyv7vczr5i/d/wB56g/awstZ+EfxX+BkOheI4D8bIdKhsta1KORVW5lZlSBp2b727c6tu+8tcGbYPDZ3i5UpJQm3Ll6StFXcqi6Rb0T+L4fiNITlSj3X9bH68xTLcxpLE4eNl3K6HIYVL0618gfsw/tNtq/9reGvE+mSeHPEehSbNe8Pyf8AMNbd/wAfUH961Zm+b/nl/uV9eJIsi7l6V+Q4nDVcJVdKqrNfdbo0+qZ6MZcyJqKKK5gCiiigAooooAjAAAGa8t+PHxRsPh14R1Ce5v8A7BHDayXd5eIcva2yfeZP+mjN8kf+1/u16Frms2ugaRd6leuI7W1jaWRz2Ar88/iF43sPjh+0raeBNV8RafpWhaFL/afiZNRvFhjv75vlt9MXc3zRx7tjbfWSvWyzArHVW539nBOUmtdF283svMzqy5PVnz74S/bB8OJ4x1T4s+JdHi1LxJo15BY+FvBs8jLa6fp77jLcRPg7rj+8zfxybv8Acxv2nvgj4I8Q6Da/GPwH42jk8PeKDJ5Hh/VHlm1CPUN37y2i6s3zN/F93/vivpz9o/4V+HfGHw78ND49XEfgbxFo8V3dS3vgvR5LqzNt5uyKPz9m1f4PkauY/Yj/AGZLTxjc2XjO60+4/s2O4lbwvHqlw0n9m2Xmt/pYQ/L5kjfc+X73mP8A3K/V6WPweFw/9p0uanyPlcfihJK6UYtpJ7c91quaXMedyS5uXc6n9n39l7xR8YPEmi+OPi2h1PWLC2itrDTLiJTYaJAiL5a+US3mXP8AFsb7n3pfn+Svty7v9B8AeH9aOmz2a6paxK8pvZcySytnyvNb7zbm4X/x2o/FHiDRfh5okfh+BrnTru9t5E037NA0jSzY+6rYO6Tc275q4ZNO1TxL4mGrWn2jxFdWUCwF5o0htkxueW1kRgNzNuT5tu5Gr8qx2Or5jV9rV0gvhS0il2SO2MYw+E0NT8YeJb7xWkPmf8IxBNDFZzt5i3YjeVm8q4VThdu5fLb/AK6x1z8vw41C70KTUP8AhHbfTVsbZri3R7iRphdW8qyq/lMu3bLsdW/+zr0LwN4Q8N6z4KeBM6j9oWe1uLq6iEd2mWw0L91aPaif9sxXSeD7yW60t9Ovz5mo6a/2W5Lj7+PuSf8AAl2t+Nefzcvw9DQ4fV/hvBqfhS71S11e5k32l7PZW0UcaW6wTxNth24Py/MvetzTPAtlrFrDrdzf34urv7NfIUn2pAUVGVVRRt2/IPvbq1/A9v5Xh240aU8afNLYf9sh/q//ACGyUmj3AtfhlbyjP+j6Zj3+SPH/ALLWfNIDivBnw6fXPh/ok39r3+mXUumOsRtZF2wtMxkaTawO7lk79qwPDvw+nvlbVbPTLO+gW6kRHkkNu00VtF9njVVUH/Wt50jbvWvTLh5dB+GVpb2vyXQsIbO3/vea6rGn/jzCk1u3sPBfw+j0/wD0g29vBFaW6WsrRzTS8KiqynduZsVpzy+9geXWOveKNA1fR7S0uBcabYtG8uiyPHayebMjbbNW53eQrea27/pnXodl4q0nxfpL6d4nXTYbx75rJtM+0eYySh28pc8HcVG7cv4VPB4O0fQvBki+ITBcPFFLPealMilhLJ80siMRlfmJx+FedxeCrjSZ7HxFLb3Gk+RFGIL8hFawtk4LTr/FNL96T5flX5KPdkB4f+1j+xWNXkm8YeDr658O+L4VdrXxBZSNbyO/8MN4yEblb7qz/eX/AJab6+dv2dNR8CfDBNT8deK/D+v+JPi/oeoQWOt6f4iuFkbRo3ZUbUl3JuZf++9v+4++v0m8EeOrbUri48PaxJqF9qt1PM6wXtpjzLQr8s23ACw4+T5v4q+Yf2uP2d9a8Na/Y/Ef4dSXFp4w0hZPsbwffvbbb89i399lXe0W77y/J/Alfa5Tms6sf7Mxc3aWid7f9ut78r/D/Cc848n72J8kfEb48jUfGkmuaHretap8WNH1uO08PajPpH2W41zT5lzJHdwKAPL3HbEn32STawr9If2T/jpp/wAVPAGkTwCS3huUZI7aWXc1hcx/6+xbd837v70e770X+4a+NfgHafA7S77RPiLqesXHiv4h+Jo7m+sm8UyeXDpV1aJmX7TKzFVbzNm1v7vl7Up+hfHzSvA3xQ8MeIotQ0fSdF+I8rf2ra6VfrJHp+pxyvHHqCqwD+TLJsbcyr8vmV7ucYKGYU/q9CjJSpLRyVrtX5opWWnuyadvi5ox+IypT5fmfqhRWJ4T14eI9Et7wx+ROcpcQ/8APKVeHX8Grbr8lPRCiiigAooooA8A/a0+LVl8M/AmoXt3LGkOmWv9q3CPzvZXVLSP/gVwyf8Afuvzzt/+CdXjH4qeHtI8ZJ468OHUvEVn/a2y+kfdNv8An3blB/hb5vvV7X+3HPd/Gfxtofwy0y8t7GfxDqc2o3uoTybYbLTLBWj8yX/Z3fapa8z8P3sH7KOo6P4F8QeNLfx18HPGOmTy2WtWk/lzWbHcsjWzZbylbbtZVb5/Mr9TyWGIy7ARlgKiWIqNy5eXmbhG6087pu3Wx59VxlP3tl+ZA3wx8fzX2h/s7eMvGX/CReF9GkXxHrjadI8rQwfdgsUdsM29mTb8v35P9iv0p8NWNj8HPACT3kDxou17sWUBkW2+VUVVVf8AlnGqqv4V8of8E8vAk2ttqvjjU2e5uNcvpNQEk+6RhbQs0NpHubn73nP/ANs46+kfH058Q6zd29vPqeuaNFbGWez0oo0dtPG21fnHzb93zbOf9X92vB4ixk62J+q6Wp/FZcqc38bt3vp8jopR93m7/kczpenweNNb0y1nt5dQv9QtLiVW1if7RE+n+ah3RSoTtkVvL+625Wr0vTLmf4esbDVlS40q4n/c6xGm1jI+OLntuP8Az1+638WzvH4c8DX1jp0Wp2+p/YdbuP8ASJvJt/LtZt3O2WDgbv7zLtatuDXBcR/2d4lsEs5pl8ltwElpcbvl2qx/vf3Wr5GU+b0NCtrcL+FdWn1+zjMlncbf7Ut4xyVXhbhf9pR97+8v+4KsanKmm6vaa7bnzLO5WO1umQ5UozZik4/usx/4DJTo45/Byxohnu9D6ZbdJJZ+n+00f/oH+79y9ZaFFa215YkI+lzghbbH3N27ev8Au+lQaFWB10zxvcROfk1O2Fwh/wCmkXyP/wCOtHVG8gNv8OtXtu+26t1/4FI6r/MV1X9nw/6OzIGe3H7p35ZflxUskKSoUdEdD/CRWfMBzusW/wDaHiHRLBMeRZbr2YH/AGV2RD/vpt3/AGzqM2p8Q+L0uXObHRSyRL/euXXDN/wGNtv/AG0eugNmgklmX5JpECGTvxnH8zWNN4eaPS7fSre4kjs/ma5mMn76bu3zerFvmarApLB/wmmqR3EhH9iWcu+3h7XkyN/rG9Y0YfL/ALQ3dkqt4g8RS69dXfhzQraG8v8AHl31zdR77OzUj/lp/wA9JMdIu/8AEVFWri4vdauv7J0Umx02EeXd6knUY48qH/a9W/h5/i6Kl5YeGbI6XoWnm7ukJxaWvQOf4pZD933ZvmoA8013w6fh/wCIIGDyXd/fmeW11CB9t7c3XlL5jXLsRHt2/dX5URa6nwdqOlfFDwM2kRXOqXf2eJFl1KZtzJcrg/LMPleRGHVPlrQ1nwBqHi6xlbXtTjlutjfZ7WK33WVu/wDeaNuZz/v/AC/7NcP4JvDpmvWlzd3N/pttcTTvqF6I1hsLmSL5I+oARdq/pGta/FHzRmfmz+0X+ypp8X7UFhpOoaoPC+neM7mW2ivkt/MgttX43RsuRtjlZ45V/wCvj/Yr0aw/Zc+Efw9+GOqaNYXur+PdS8Vzt4Yl8W29ui6fo2oJInlKyMQy/v8AYm5d9fSH/BQX4SL48+GtxqVhk6nHB/aenTQ9ft1qjSx7feSHzl/7Zx18H61ZfFv42av4P8eeBPh/J4aaWVtRh1i21PzLSa+Ztsk22d/JgdpA77FXd8/ev1/LMdiM0wVGUsR7NQ0ldpLmjrFtu0tfK/w+9E4px5Jv3b3P0G/YX+LsvjzwRp6aoSmup5mk6zDJ95NSs1VGb/tpDsb/ALZ19YkfhX5gfswaB4l/Zp+PWt+CfFep/wBq6vrelWni/wA7zPM/0uJj9rX/AHvLknXd/F5dfp4kgdNw71+ccQYelQxzlQs6c0pRa2tLXTyT0OylL3fQmooor581CqOr6iuk6Te3r/ctoHmb/gK5q9XLfE+5+z/DzxIy9fsMyf8AfS4/rQB+VPxQ+P2i/Cz9qjxBqXiLwvJ4yj0zwjDoL6R5qiGdp1SW5819jbV/ev8Aw1g/GP43/An41fBy9OgeB7zwv4y0XT7fR9A0e6uFNqkc1zukaBVPzMvz/My/8tK9q8H+BT8UvGn7Q0P9r6f4esb3xna6Tqj3921ob3T4lcS28cg+6zfI1c78Zvgwfh5o/wAN/CT/AGC/8P3fxHsrbw88d2l7dQ6eq/NHJOI1b5mbdt/hr9woVsBSrUaVpKrTUNVJpNKCk9Nnu7rtze8eVPm97s2fa3wP0G7+E/wUeDRNFfWb7SYLfTotPSRYWnWCNEfa3K7txmasnW/jDp+tvHqVt4BOpCGVob29tJJ4bi1lHDKzrArfX5q9c+Ds/wBq+HOlXbf8vXnXHz/7czv/AOzVwv8AwrrQPinJP4x0G2j8P67NLJDLcT2/nR3Sj/VyMiuv3l2OrKyt89fjc6vtas6tXdt6+p6X2SSH433GleG0vTokk8a7XaC5v2a88pm/1ir5P71V/wBjdVmP9oTSNc0s3Fja2epWcqcOLsqj/wCz80Yryjxf8MvGvgy4lSTQpfGWm3Eu+L+yI9ywsfvfuncuv/fX/A64nxR4b8GaXeW93pV5H4e8ZzNsfz5Io4fWRZ4t5dv+2rLXTClSn/wBc0j3HR/2mBLfW+mt4Y+z3EzGK3toLhpmfHLbdsfzLt+b5a9P0T4i2epXkdldItldzf6pPM3K7f3ezK3+y6rXyX40t9V8UeF/7Ju9P0+SSxVXi1TwxcRSQ21z8u1f4FVv9ldz7K6z4V+KIrz4f/atVjt/t72dzYul3tW4e+T5drfIjRfM3919n9+oq4eHLzRDmPoD4heIvEehRo+gaLPq37pmYwRpI27cBt2tIlcD8PPEfj/WdI1PWL55LRLZpvs9lfeUzXLIzblkVUDQfMu1fmeuhu/jRpHhvwJo9215b6xqssEEb232yGGXzCq72k3sNvzferyTT/jZd6Jqlx+7t59NlnmmlR9UsY4/Nk3O3/LYtt3M+2sYQlKHwr1YH0r4P8T2/jLwrpWuWqGODULWO4VSclNw5X8OlUvEPjK20ed7WBBeXybTKhlWKOEHoZZTwuew+9Xlf7PfxN0uw8BDStf1TRtGuLS5mS1hOp2x3wM5ZNuyZ/u7tv4V5t43/aE03wnp2p281kNRuIb6fVFjEiwyOsk7LbNIskbfNt/h+/8A6uojh5Sm49mHMd94s/aP1fQvEKaFY6Ppl3fyf3LmSZU+bbuk2JtT/gTbv9iuhPx6stE08zXtjaabaxL+8mkknjhj/wCBeQVWvl3w/eeOLi33vHpei3FxK1xqGoXciyXDzvt+9EuIlVo/lXzW8p/L/garlnp/gy/vPK8QaxcalfwyySxO9wu217eX5DIyL/usqP8A3a7fq9L/AIYOaR73p/7SSeNYrttNtgljC6pHJZXbfaLl/wCLYkkH+r/265y8+Nmj6Xe/a38IW935O5P7Q1K8a8m3/LtWLcpZv+A1zvgz4XeMdYSAaf4Yk0bTdQf5danuI1ZIN3+s8pnLruX7vy/98V7RonwU8LfC1LnxBHbvquqWis1tNexxFombj93sRcM33d33qyn7Cl5+SYe8Ta7/AGx4o+Et5qHiHTYNPvoXOoR2abtyRRuGAbk/M0e/cv8At4r85/2YvCeh+C/it42uvGvjDSLTRvhjqd7b+HvDOuXiWsLzzSMUmbP8Pyp/e+av018H+J/+FkfDEajNBHBPdW09vdQKcqk6F4pV+m5TX5b6z8JbD4kfH/4v2jeGbTxR4iuNO0mXSoJ5ZV8ma7+zpNefuiNyx+ZubdX1nDcoypYvC1JOKaTbVm17yi93ppJpvsc9X4oyK3hK5ttJ/ae8HeP9X+JmieMPFniPxG2narZaPI8kdnbXMDRxqrOi7o/m2rt+VV8uv1n+HWqNrHgjRLpv9YbdYpf99Pkb/wAeU1+WHxj+FHwl+HOuFPBGiahpmu/DjxJoVlf61PdySQ6tLO254/myqtH5e75a/UD4Vxpb+H7y3QbY4dVvVUfWd2/9mo4pnSrww9elfZr3kouytJaR0taSsFD3bxO3ooor4I7ArkfiuAPhz4gP920dvy5rrqwfHNi2p+DdctU5kmsZ40/3jGwFEfiA/IOT4WeBPEPxg+N/jD4t+Ir/AEz4f6D4omiGm6c7Ga8vppZPL+RQdv7tfv1JqPgz4d+HvGnwc8XfCHxPqeq/Du98aW9ndaTqm7dZ6guzb8rAN80bVo/ED9oTQfgf8Y/i9p3iTwJYeOYPEl9pms6dZ6r/AMe6EwbzM3Dfd3/LtWuC+IH7bWlfEHwvoWj2/wAONH8Evo3iGy1y0fQEVY/3e7zN67R823ZtZa/oClRzCu4VYRk6coxXxR5OV019n4m1J/EeVeMfv/U/Uu48Ry+HP2YbN7UGS7uLJdMiKfeDyOYd3/Ad278KZ+zf43i1Gzi8PrblHh0y1l84P8u5I1haP/e/d7qrtpN742+Bep2Ph0ifUdK1Vruyjf7s2ydblE/4FHIPzrxz9lPxnZaR8bfEuhXt29qbu8aayjuNytyrDyf975vu/wDTOvxDkXsp90z0ftRPuWszU/D2lawMX+mWd/zn/SbdZP8A0IGtOivOND5a+OPgTQvhx4q8N6t4a0+38N/2it1aTnTpFs13bVZW270Xd9+vJZNP1DwPqlxdxafceJfDUqyXF7a/L5yMNzSKvmAN5beYit8u/wDgX79fZvxK+H1t8R9AFhPd3Nhc28n2iyvbSRkktpwrBZPlI3Y3fdrwTWvhH8U9Jje2s9M8P6zaLwHtLtrWR1Xcy/I6lV+Zt3+s3b/m3/3PRo1fd5ZS+8zlA+OfiB4f1Dxx4o1DxBaSSXcFx9o2PffLJ/o0CvL8rAMqru+Vf7lYdv8ACPW7i48pLe3jd7y0sfnkVf3tzF5kX/jtez+N9M13QPHc9nrv9n73s9TdvsVx5ywyvYvujZtoXd+7+4u6l0S4/wCJpG/l/wDMd8MPs/3rRhXrc/8AJ2Mzx/R/h/relx2+txSR2n2eBtRSZJNsiLHcrCzLx97zK9wsvD0PxAt9HstK0O4g8NJKtxq+oSSMrXLD522sx3S/3vmX5P4X21y/hu5vXuPCdpY6pp9j/wAfqXFzfbmt7ZV1DdD5u3LKrSbK+jNM/Z1+I15cRq/iTQNI0lnwr6cJppPL5KtFu27WX+H5vl/77351asY/E7AQ/DP4W+GviF8U7t9T0uW+tNP09kmV9y28zOy+Wr/IrN8qu21mf/fevqDRfCmi+Gt/9laRY6ZvUI32O3SLco6Z2gVk/Dz4d6d8ONHksNOaSd5pWuLi8njjWa4lP8T+Wir/AOO11pGTivErVOeV+h0RADNeffGbxPa+G/D9nHOf397dxpBn7u5MzfN/s/u9v/A69CXpXzB+2V4vS28P/YtOjuJ9ZtHjfZHGzbNzI6t/u/u/mow8Oeqomc/hOr/Zt1+3ufCuvabEMiGebVFf+/HdyzSL/wCg18DX3w08ReO/2pfH+oeE/HZ+H/iTw/4e0t7fVpJ/Jt90kECNDI+PusrfL/tV9o/AnQ7vwr8HfE/ie6JH23T47WyQfNmK3g8qNvl/iaRnr82Pih8ddE8O/Fb45aLqumT6xDq95aWllc2sibbaXT3/AHe6ORCskbNGm5favu+GMPVq1sUqG/KlsmtZxvo9HpfQ5qv2eY7T4h/sy/FL4YfDie48a/EW21jTW8S2UqaZY37XUNzeTT5aSdWQNu+/96v1a+GJA0fU2/vardn/AMiYr8gvAPx1h+NXiHwxoF7BPL468UeMdJu9XuoLSGzsTBbM4XYqMWdmVvmZlWv19+Eu+XwJZ3T/AH72We8/4DJO7r/46wqeK/rMIUaWKtz3k9FyrVRW3qnr1HQ5deU7aiiivz47AqP7/wArVJRQB+KX/BSz4by+GPiL4f1xExBcWsujyuBx5lpKwT/vqGSGvliPwLqr+AZPGP2f/iRpqK6X53zf68xtJjpj7q1+s/8AwUo+EreLvhn4kuI7fzri2jj8Q2Wz73mwL5V2v/gOyN/2zr8srX42+ObTwU3g6HxNdx+F2ia3fSRt+zuj8tuXH3v9r71f0ZwrjauMymlGla9N8ru+i10+R41ePLNn68/8E8/iU3j/AOEmlG7uTNPd6csMo3/8t7XFtKf95o/szfjXPr8EdP8Ah78ezp+pahealjT28Q2WyR4fuTsrRq24s0ix/wATNXx9/wAE0/jLL4L8f3nhRpDI9xL/AGnpsJ/5bSomyeFf9qWD7v8AtRx1+jH7VEa3/gXQPF2i6fJqV9YzLNaajZSfMkUyhduzrIsm4Ltr8mz7Byy7NqtLaFR3Xo/8noejSlzRUux9CW9wlzAksT743Xcr+tTV86fsya0PBPw8t7DXtX8tbnVZ7SyhuLdomtmHPlyuxPzNyy7tv92vfNR1GHSrGa7unKQRLudkjZsf8BUE18hOPLLlOg53Wfif4e8Pa9Hot/evBqTxeckP2eRvMX1VguDXOeLfiRDqei6JLoCXmoWGq6gdMluLFNkkbbX+Xc2Nq7l2s6/drifiv8UfhT8SIbbwtrqwazBcSNmWOSPzbD5W/fLtJkRv+A1yGueH/hzJ4EGi2XijU5JorVciSOTybl0+6zKy/K3T5lauiFLbmi/uMzgfHmhw6hH440XUPs9xdpdW8NvewRttTzFRfLi4/vR/M3/su+uHs9L8UaP4kk0Saz/0+bUdIdNU8tvstt9jVo906Z3fxJVfUNQ1PwX4hj1C9s49d+3WfkxJBG0MdlBJu+0x7mPyybW+8v8A0027K0H+Kj2d5/Ymj6f5+i+Vbpb6hrNxH9oSzZnLNP5blmk3Sfe/6Z/NXrx+8zK/hfQ4tLt/GFpoV5b6lfy3Vl9ogn/dtN+/Tzmi2jdtWb+79yvrj4UfEu30Pw74iuPEWqWlpoejpA3nveRzJBvVmZVZP4fubV+9/s18n6H4sfxBo+j+H9E0+PSdJ0afzrKC+s1vLraVfzZJW8ttreYqN93/AJaVT0+8t7PT9QtL3w/4o11766W7uPsskVvClyq7fusjfNt/3f8AWVlVpe1+IIH0o/7aFv4p1/T9K8HeGLy7t7u5jtv7Z1f/AEW1Tc20tt5Zlr6Yt7iK6t0likSaNx8rochq+af2YZrDx1Hqq3PgyfSY7FY0lmu54/30h+YL5SKG+7/eZq+krKygsLeO3toUgt0XakUabVWvJrwjCXJFWsdBaxXyT8e/BF749+Mei6Jout/2XPrbNbzxuhfZFbRs8s3X+LdGmz+Ly/mr0j9on4gWNv4J13QrC/kbWESGWdLWBp/JiM6K28L/ALLfdrif2TrqT4ieLPEfjrULe4nuDGtjY3N1Gy+TEWLyRrkBWZm+ZmWtKUZUouqZy973TovjDeWPwP8AgrBp63ElxaabFNqd5NPhWmig3XEnT5fnl8tdv/TSvxP0H4Z+K/i1o/jbxpaWc93BpW29v5kt5H8ySadRtXaD837zd/u192f8FR/j4lxpqeE9Ku8vrDbH2H/lxgkbd/38uF/75t6/Pvw/8VvGHhTSE0rRvFGr6PpyO7/ZbG8khjLN95mVSNzV+18HZdiMPl0sTCynUaev8sX+up52IlzS5ex7N+wL4Tl1v9oO21NY9/8Awj+nXeo7H/567PJiX/v5MlfujoGlpoui6fp6fctIEhH/AAFcV+a//BLT4SS2ugy+J76H5/EN4ssJb5m+yWbEszf7LXDR/wDfuv06BxXwfGuN+t5rKEdqaUfmtX+LaOzDw5Yeo6iiivhDpCiiigDi/ih4Z/4SfwncLHb/AGq6tG+0xW//AD2wpV4f+2kbOn/bSvwg+MvwD1HwF8cl8FaWRPaa9cRNoFzJJiO5tp5cQbm/2fuN/tRmv6EB19q+Ef29v2YJvG/hz7d4fR113T5ZNT0F4/ldJvvz2K4/56bfNi/245F/jr7nhPOXluLdKcrRqaXeyfRnHiIc0ebsfnz4j+Hmj+Apll+Gmu6t4s8aeDZm1TXNd0228rSrONGUL5DsfMby5B95l+bJ/uV+pn7FH7Sml/GHwHp0gljt57iRoZrXtZ323fLb/wC63MsX+zvX/lnX53/sz31n8bvib4Q0Xxjd3fiXUb7V9s/hK1tI7CzeJF82S+vHiUee21XXay72/ibb9+vbeLNR/Za+L2u694T8jWPB17dvFrmhaVI8kOloZ5DBbtOuUW5VVDIyt8rZWvv86y7+1qcsFPXEQ96Mn1u2mr6btaaJfZOalLk97oz7X+PR1Xwh421/Tf7Uzcfao9cgheLPnxr92bZ/y127nil2/wAH8Fe/fAf416R4y0DQtOlnWPUbhpre3gQtKuYo1d18z/ZDcf7OKwfhj4+8CftK+EtEl1mOw8SB083TtSdPLaZ9vzAMMGC5XO2SLd23L8vTy74s/A74heFfiTHc+ALC8t/DcLRy6cmlXGFgn2sPn8xmYfx7m27f3lfjk4XXsKseWUe+mqPR+D0Ppf4k6h4G8IXOn634jtNP/tWFmmsp3t91xuRedrKpb+KvO/Bnxz8T/EHxhqmmeHtIaS08pbiDUNV0+a0t1X5RIqMVDN8zfxV0XwX+L2ka/wCHrWxW4uLkWKLbzXtzd/aJY5futHc7gskb7v7y7f8Aar0Tw5460PxVpiahY6gnkPPLbr5/7pt8blHG1sH7ymuH4NJRuzQ425+DV34txJ4x8RXmpu67Xs7E/Z7fH93/AOyXY1b3h34Q+DvCuhyaRYaBZvaShvN+1R/aJJs8/vHkyz/8CNdlHOtxHvikWRP7yHdUnNZ80u4Hm0vwL0C0nkudBkvPDl0/X7BO3l/98tnb/wAA214r8bfAvjqynzY65Z2nmqr/ANspH5LzYbCxy7nCbv8Aa3fNX1Xc3dvZxebcTxwx/wB+R9ormtX+JXhPTFvEutc09/s1nJfXESTrIywJ95mVc/LzWtKrKEu5nynhH7P/AIn8e2ni+TSNV8GWc5lt08/XILyeH9yrYVtku5X+9/yzr134k/GHRvBNjqcElxL/AGrDAfKSOMtmVtgWNezSfvEbZ71wEfxv8BaPpVz4tsrCz0X5JLaGd5PLW53bSqxRJ80rM391f+B15U3wi+I3xP8AFkfim/8ADFva6brsvnyw3FwkcltGV2x7omyy/KqMyr81dPJCc+ar7q/UP8JzHhHVfEXi7xfc3yxx/wBparcrFotlHtm3yx7tsjbsq0cCyPLJK335a+jfjz8UNL+B3wpeHUdYuE+x2K/bNTYk3EcH3Ny/9NpW+RP9rLfwVavtM8G/s8aHcX2n21pa6x9k2S3t7cH5IExukld2Pl26feZV4/ugtX5f/Gv4n+K/24viRf8AhHwTdx3Gk2EU2owxX0qW9xrlzGmFZYmI+b+GKL+FPvfNvr6DKss/tivzz92hDWUnpp29TOcvZR82c78OfCWl/tofF3xff+Ktdv8Aw/evFG+kaZpscUrJbI3l/wDLV1DRwRqm7a29uW9a881r4I6Bq3xN8MeDvhn40Hj19blW3a8/s+SzjtnaUp829jxtXef9mvWfG58L6LY+HfGen/Em30dfDVgsWn/D/wAiSHVdL1VY1SSHZsC+W0y+bJK33v8Abr3f/gn7+zhcaxeSfEXxDapb6/4qEstvBHb+Uthpjs3nTqqjEbTt+6j/ANjzGr9WxWZf2ZhZ4znappKMKbVkpJNW1jdq1no7f4jhjDnnyfifcv7Ovw8sfA3gfT/sX/HmlnBp9gXj2t9jh3CNv+2jM8v/AG0r1vGR71DBbpawxxRII41UIqL0UCpj6V/PdWpKrOVWWrep646iiioEFFFFABWN4k8P2vibR7nTrofJL9x1+9E45WRf9pW+YfStmigD8jP23/2XvE3g3xFqPxB8K+Za6skDf8JDDpG63+0QH5W1CBEP+rfdtnjX7jf7MlcT8NvHFv8AEeFPsFno/wAP/gR4LtY7jX9Kurj7VJfyOFDtLEpD3M0rfJHu+Vf96v1/8YeDbTxbYwo8j2l/auZrO+gCtJDJtwfvcMrKdrK3DKSK/Lb9q/8AYH1TSvEF54g8C6XAl8d11eeFYN3k3aI2Wmscncy/3oPvp/BvWv1bIc9pYylHA4+fLKOkZvttZ625kvgm/h/9K8+rS5fej9x5f4Z1DxJ8CbuX4mfDGzv9V+EWq3LO2h6rJteRU2lwyA7/ANwzbVuo1+V4/wA/0M/Zq/bd8KfFvTY7VNTlurmFcywXHy6lbL/00iH+uVf+esW7/aRK/Pey8aQ/tVeP/Bvh+51OTwLpmlWs0M+gWtvFDDZWkcGyS109s+bLJOqv+6b+L+/XNftM+C7X4cy+C/FenaAfhv4n1pru/Hhi1uH8zT7VJQLSZud0EjKfmT/pn/B9yvfx2U4bNpww+K9zENaNa6a2Uv5nZatf/ImUasqXw7H63/En4LaT8RYJfFXgK40vSfFczKzazabiL2Mbt0UnlsFO7+8wavn3xx4M8dfCTw3Hb679n0nSridr6XXbGOe6t7K8f7zK0ZLxfL8rbo/Kf+5XzD4D/bZ+LPwct9J1X4ieF9TvLfU4lls9eg/4l9xcxf3pPkMNx/s+bHv/ANuvqr4e/wDBTzwH4mt44tR1SztpXX54Ncgk0+T/AL+oJoW/76SvgK/D+a4L4Ie0gnvH3tvTX70dsasZ+RxXgn49ePfDt3JJF4w8P6tbp9+6063jb5f70irs3L/vLvr1/Qv2xPG0/h+LUr3wIZLRknd72CC5S3Kp/Er7G+Xd8rf3a9U8I/HvwRrmnCXStMt7iC4X5zo89neRv/s/upCzf9812EfxS0iOBFTTNYVNu0Imly7R/wCO7a+eqv3uWVGz+40+Z8a+L/jf448Z+XrF7f2fhOCaLfbzT+R5PlN/DFLKCysv8W2PfV74PaN4k+JmtSWFncf8JLoU1xHLqmpxxyw25MbZXdeSpunZf4Ylj2JX01qvxe8J+GtNuIm0T7JZoxZ0u/stlDu/vN5si/8AoNeEeP8A/gpD8OvBkb29trukIYQV+y6Ukmpzbh/D+7CQr/38rtoUMVivcwuHb9Fcz92PxSPbfBH7PmifDrxhq/iu91QaqkgZ4BqlvEWs/m3M3nH6dflrH+OH7VnhL4W+GZ9Qm1aCxt2RvJ1C6G5Z2/u20WQ9y3+7+6/vPX59fEf/AIKMeKvi3r9loXgXQDLqV3OtvYXuvvHMySv8i+VariBW+b70nm155cfAO+8ceNfG1p8avH174e8fW2mpq1pqN5GuoWF7bFgPM8+NziJQw/1a7VX/AHMV9RheE5qUaubT5Va/Kvem1dLZX0131M51/wDn2aXxT+K3jj9r6LWrrTEvPDnw10yWP7fcXXm3U15cn/UfafJRmkkb+GJV8qL8q6mPU/gvrX7MEl9YNeeHdLiu7SL/AESztZtZ8P6lFubzvPLxy3K3P+z9z/YrX+KvxL8GfA3xdaav4fu7SWe20z/hC/FPhbTrxlXWLVLRPJvoJY1Kxf6z733v3fy/x1i/Av8AZR1X9onVdA8U+MdGk0Hwmtslno3hrTo/JutRt4c7T5rcrD83z3Unzt91e1fY8+Go4OFaUXQowacbbvurP4pNq/N8PL/29E5vflLuyD4CfCjxL+2D8SdO8f8AxGik1bw7aeVYWkJt1gl1+eH+Bto+7/FPP/wH6frb4H8HReEtI8kmJ76ba11NCmxWdVCqqL/DGqjaq/3RWV8MPhlZfDrSLaGC2toJordLSKCyjK29nAv3YIFPRR3b7zt8ze3eEhBmvyTOs4nm1X3Y8tOOkYrZL/M9ClT5PUkooor581CiiigAooooAKKKKACsbxB4c07xNp32LUrZLmLO9OqujDoyMOVb/aWtmigD4R/ab/YG0L4i3tzrsdvc2erONy+JdIi3XSsPuteWq4Wf/rrFtl/vK9fnN8VP2efHPwv1Yaz4y0q78TaB9qjL+INLvPtFvdRBvmXzcMYmZf8AnptK5+7X9AgOa4zxP8MNG8TPcXGyTStSmXa9/p22OST2kUgpKv8AsyKwr7nKOLcZltqdT36a0s3ql5Poc86EJ+R+RVv8dtF+K3xH+EOk6br9zps9pchNe8Qa3HBawzWaJsijliZ2ikmig86Lz/k3+Z9ytjwH8HfCv7SvjvxBr2raDp/hjSdRTUrfwvpGiPHYSXqw+a63jL/y0VfkibYvzN/uV9a/F3/gnJ4S8dI8n/CP6et43/MT8ObdKuv+BQENbyf+OV826l/wTu8d/DnWP7T8GeO9U8OXFvu8qbUdPubeSFT95VntWlTb/wB819bQzrLK9K9Cs6FS1ldXtq3utLdP7sfhOeVKcelz5rk+G/w80/4A6X43ub/xPp3iTULm50+0t08iS3mngijeSToGWPdJt+9XXeN/2ddP8H/Ffwz4Fm8fappr61c26/2vq8ccdmkEkCu0isJy25WbyvmVK2df/ZN+Ot54c0rw/NqnhzWdE0e5lu7C1GsWkeySRt0jfvNj/M33t1aGv/Cf9o3xP4o/tu+8J+GLjUjP9omvf+JSPtL+QYP3nz/Mvlt937lfV/Xqcpc0MbCz595x0u1yWuui38zm5fJ9Dxn4rfBeP4efFvRPCGpXetadDqDwC4utfs1hkhWSXY0i7JHSSPb8wZWr3q9+DfgH4WeJdeu7vwpGieB/GOn6U41mR7iHX9PutyMzRNgeYq/vVaP5a5vxj+yx8c/irc6QfFE/hixTSbNdPsrX+1LSOO0gGSqrFBu7t/dr0HQ/+CePxH8d2NhZeMPiHqGqabZr/o1lp1neXyw9vkefyol/76rkxWbYT2dNYjGxVlaXK276r+Xurry5uY0jCX8p4R8X9a0zwJ+1lHNHrE93pXhnVbZPtpt7Yt5ULqf3aQYRl2/d/i/vV6D4b+KXxx+P1t/ZXhDw5ZXWmadfXM2leJbvS4LUaHZyKY/s6z8QxR+W3zL81fZvwg/4Js+B/Blukl14ct9UvN2/7b4pk+2SR/7trFtg/wC+mevqjw18IdD0CO389X1SW3CiH7WF8mHH/PKBQIo/+AqK+Ux/FmBUYRw1L2s4JJSkrLTqku/yNYYeX2nY+Iv2aP8Agnbovhe9tNY1oJ4w1ZR5o1K+tNmm2r9f3ED4a7b+7LJ+6/2K+9PDHhGy8LxymFZLi8l2+ffXPzzzY6bm4+UD7qr8q84FdFkZp2c/WvzbH5niszq+1xU3J/gvRbI7YQjD4R1FFFeaWFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAFa4sre8j23FvHOn9yRA1UF8J6EnzJo2np9LRB/StiigCtb2VvaDbBbxwf9c0C1ZoooAKKKKACiiigAooooAKKKKACiiigD/9k=","base64"), 101.92, 100, {
        floating: {
            horizontalPosition: {
                offset: 457200,
            },
            verticalPosition: {
                offset: 457200,
            },
        },
    });

    entities.push(new docx.Paragraph(image));

    entities.push(new docx.Paragraph({
        children: [new docx.TextRun({
            text: "UNITED STATES MARINE CORPS",
            bold: true,
            font: "Times New Roman",
            size: 20,
        })],
        alignment: docx.AlignmentType.CENTER,
    }));
    entities.push(new docx.Paragraph({
        children: [new docx.TextRun({
            text: line1,
            font: "Times New Roman",
            size: 16,
        })],
        alignment: docx.AlignmentType.CENTER,
    }));
    entities.push(new docx.Paragraph({
        children: [new docx.TextRun({
            text: line2,
            font: "Times New Roman",
            size: 16,
            alignment: docx.AlignmentType.CENTER,
        })],
        alignment: docx.AlignmentType.CENTER,
    }));
    entities.push(new docx.Paragraph({
        children: [new docx.TextRun({
            text: line3,
            font: "Times New Roman",
            size: 16,
            alignment: docx.AlignmentType.CENTER,
        })],
        alignment: docx.AlignmentType.CENTER,
    }));
    return entities;
}


function GetDynamicViaTextBox(value) {
    return '<input name = "ViaTextBox" size="60" type="text" value = "' + value + '" >' +
        '<input type="button" value="Remove" onclick = "generatorBundle.removeVia(this)" >'
}

function ShowHideDiv(Id, Id2) {

    var chkYes = document.getElementById(Id);
    var dvPassport = document.getElementById(Id2);
    dvPassport.style.display = chkYes.checked ? "block" : "none";
}


function AddViaTextBox() {
    var div = document.createElement('DIV');
    div.innerHTML = GetDynamicViaTextBox("");
    document.getElementById("ViaTextBoxContainer").appendChild(div);
}

function RemoveViaTextBox(div) {
    document.getElementById("ViaTextBoxContainer").removeChild(div.parentNode);
}

//Ref Text Boxes
function GetDynamicRefTextBox(value) {
    return '<input name = "RefTextBox" size="60" type="text" value = "' + value + '" >' +
        '<input type="button" value="Remove" onclick = "generatorBundle.removeRef(this)" >'
}
function AddRefTextBox() {
    var div = document.createElement('DIV');
    div.innerHTML = GetDynamicRefTextBox("");
    document.getElementById("RefTextBoxContainer").appendChild(div);
}

function RemoveRefTextBox(div) {
    document.getElementById("RefTextBoxContainer").removeChild(div.parentNode);
}

//Encl Text Boxes
function GetDynamicEnclTextBox(value) {
    return '<input name = "EnclTextBox" size="60" type="text" value = "' + value + '" >' +
        '<input type="button" value="Remove" onclick = "generatorBundle.removeEnc(this)" >'
}
function AddEnclTextBox() {
    var div = document.createElement('DIV');
    div.innerHTML = GetDynamicEnclTextBox("");
    document.getElementById("EnclTextBoxContainer").appendChild(div);
}

function RemoveEnclTextBox(div) {
    document.getElementById("EnclTextBoxContainer").removeChild(div.parentNode);
}

//Copy Text Boxes
function GetDynamicCopyTextBox(value) {
    return '<input name = "CopyTextBox" size="60" type="text" value = "' + value + '" >' +
        '<input type="button" value="Remove" onclick = "generatorBundle.removeCopy(this)" >'
}
function AddCopyTextBox() {
    var div = document.createElement('DIV');
    div.innerHTML = GetDynamicCopyTextBox("");
    document.getElementById("CopyTextBoxContainer").appendChild(div);
}

function RemoveCopyTextBox(div) {
    document.getElementById("CopyTextBoxContainer").removeChild(div.parentNode);
}

//Body Text Boxes
function GetDynamicBodyTextBox(value) {
    return '<textarea rows = "8" cols = "80" id="BodyBlocks" name="BodyBlocks"> </textarea>' + '<label for = "bodylvl"> Select the body level: </label>' + '<select id="BodyLevel" name="BodyLevel" >' + '<option SELECTED value=1>1</option>' + '<option value=2>2</option>' + '<option value=3>3</option>' + '</select>' + '<input type="button" value="Remove Paragraph" onclick = "generatorBundle.removeBody(this)" >'
}

function AddBodyTextBox() {
    var div = document.createElement('DIV');
    div.innerHTML = GetDynamicBodyTextBox("");
    document.getElementById("BodyTextBoxContainer").appendChild(div);
}

function RemoveBodyTextBox(div) {
    document.getElementById("BodyTextBoxContainer").removeChild(div.parentNode);
}

}).call(this,require("buffer").Buffer)
},{"buffer":4,"docx":2}],2:[function(require,module,exports){
(function (Buffer){
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["docx"] = factory();
	else
		root["docx"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 116);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(117));
__export(__webpack_require__(118));
__export(__webpack_require__(50));
__export(__webpack_require__(119));
__export(__webpack_require__(135));
__export(__webpack_require__(136));
__export(__webpack_require__(20));


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(48));
__export(__webpack_require__(195));
__export(__webpack_require__(17));
__export(__webpack_require__(2));
__export(__webpack_require__(34));


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(28));
__export(__webpack_require__(7));
__export(__webpack_require__(141));
__export(__webpack_require__(142));
__export(__webpack_require__(144));
__export(__webpack_require__(31));
__export(__webpack_require__(192));
__export(__webpack_require__(15));
__export(__webpack_require__(30));
__export(__webpack_require__(194));


/***/ }),
/* 3 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.



/*<replacement>*/

var pna = __webpack_require__(12);
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = __webpack_require__(11);
util.inherits = __webpack_require__(6);
/*</replacement>*/

var Readable = __webpack_require__(54);
var Writable = __webpack_require__(24);

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



var base64 = __webpack_require__(121)
var ieee754 = __webpack_require__(122)
var isArray = __webpack_require__(52)

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 6 */
/***/ (function(module, exports) {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const emphasis_mark_1 = __webpack_require__(30);
const formatting_1 = __webpack_require__(140);
const run_fonts_1 = __webpack_require__(31);
const script_1 = __webpack_require__(64);
const style_1 = __webpack_require__(65);
const underline_1 = __webpack_require__(15);
class RunProperties extends xml_components_1.IgnoreIfEmptyXmlComponent {
    constructor(options) {
        super("w:rPr");
        if (!options) {
            return;
        }
        if (options.bold) {
            this.push(new formatting_1.Bold());
        }
        if ((options.boldComplexScript === undefined && options.bold) || options.boldComplexScript) {
            this.push(new formatting_1.BoldComplexScript());
        }
        if (options.italics) {
            this.push(new formatting_1.Italics());
        }
        if ((options.italicsComplexScript === undefined && options.italics) || options.italicsComplexScript) {
            this.push(new formatting_1.ItalicsComplexScript());
        }
        if (options.underline) {
            this.push(new underline_1.Underline(options.underline.type, options.underline.color));
        }
        if (options.emphasisMark) {
            this.push(new emphasis_mark_1.EmphasisMark(options.emphasisMark.type));
        }
        if (options.color) {
            this.push(new formatting_1.Color(options.color));
        }
        if (options.size) {
            this.push(new formatting_1.Size(options.size));
        }
        const szCs = options.sizeComplexScript === undefined || options.sizeComplexScript === true ? options.size : options.sizeComplexScript;
        if (szCs) {
            this.push(new formatting_1.SizeComplexScript(szCs));
        }
        if (options.rightToLeft) {
            this.push(new formatting_1.RightToLeft());
        }
        if (options.smallCaps) {
            this.push(new formatting_1.SmallCaps());
        }
        if (options.allCaps) {
            this.push(new formatting_1.Caps());
        }
        if (options.strike) {
            this.push(new formatting_1.Strike());
        }
        if (options.doubleStrike) {
            this.push(new formatting_1.DoubleStrike());
        }
        if (options.subScript) {
            this.push(new script_1.SubScript());
        }
        if (options.superScript) {
            this.push(new script_1.SuperScript());
        }
        if (options.style) {
            this.push(new style_1.Style(options.style));
        }
        if (options.font) {
            if (typeof options.font === "string") {
                this.push(new run_fonts_1.RunFonts(options.font));
            }
            else if ("name" in options.font) {
                this.push(new run_fonts_1.RunFonts(options.font.name, options.font.hint));
            }
            else {
                this.push(new run_fonts_1.RunFonts(options.font));
            }
        }
        if (options.highlight) {
            this.push(new formatting_1.Highlight(options.highlight));
        }
        const highlightCs = options.highlightComplexScript === undefined || options.highlightComplexScript === true
            ? options.highlight
            : options.highlightComplexScript;
        if (highlightCs) {
            this.push(new formatting_1.HighlightComplexScript(highlightCs));
        }
        if (options.characterSpacing) {
            this.push(new formatting_1.CharacterSpacing(options.characterSpacing));
        }
        const shading = options.shading || options.shadow;
        if (shading) {
            this.push(new formatting_1.Shading(shading.type, shading.fill, shading.color));
        }
        const shdCs = options.shadingComplexScript === undefined || options.shadingComplexScript === true ? shading : options.shadingComplexScript;
        if (shdCs) {
            this.push(new formatting_1.ShadowComplexScript(shdCs.type, shdCs.fill, shdCs.color));
        }
    }
    push(item) {
        this.root.push(item);
    }
}
exports.RunProperties = RunProperties;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(213));
__export(__webpack_require__(35));


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class DocumentAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            wpc: "xmlns:wpc",
            mc: "xmlns:mc",
            o: "xmlns:o",
            r: "xmlns:r",
            m: "xmlns:m",
            v: "xmlns:v",
            wp14: "xmlns:wp14",
            wp: "xmlns:wp",
            w10: "xmlns:w10",
            w: "xmlns:w",
            w14: "xmlns:w14",
            w15: "xmlns:w15",
            wpg: "xmlns:wpg",
            wpi: "xmlns:wpi",
            wne: "xmlns:wne",
            wps: "xmlns:wps",
            Ignorable: "mc:Ignorable",
            cp: "xmlns:cp",
            dc: "xmlns:dc",
            dcterms: "xmlns:dcterms",
            dcmitype: "xmlns:dcmitype",
            xsi: "xmlns:xsi",
            type: "xsi:type",
        };
    }
}
exports.DocumentAttributes = DocumentAttributes;


/***/ }),
/* 10 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5).Buffer))

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

if (typeof process === 'undefined' ||
    !process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

/* eslint-disable node/no-deprecated-api */
var buffer = __webpack_require__(5)
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var SpaceType;
(function (SpaceType) {
    SpaceType["DEFAULT"] = "default";
    SpaceType["PRESERVE"] = "preserve";
})(SpaceType = exports.SpaceType || (exports.SpaceType = {}));


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var UnderlineType;
(function (UnderlineType) {
    UnderlineType["SINGLE"] = "single";
    UnderlineType["WORDS"] = "words";
    UnderlineType["DOUBLE"] = "double";
    UnderlineType["THICK"] = "thick";
    UnderlineType["DOTTED"] = "dotted";
    UnderlineType["DOTTEDHEAVY"] = "dottedHeavy";
    UnderlineType["DASH"] = "dash";
    UnderlineType["DASHEDHEAVY"] = "dashedHeavy";
    UnderlineType["DASHLONG"] = "dashLong";
    UnderlineType["DASHLONGHEAVY"] = "dashLongHeavy";
    UnderlineType["DOTDASH"] = "dotDash";
    UnderlineType["DASHDOTHEAVY"] = "dashDotHeavy";
    UnderlineType["DOTDOTDASH"] = "dotDotDash";
    UnderlineType["DASHDOTDOTHEAVY"] = "dashDotDotHeavy";
    UnderlineType["WAVE"] = "wave";
    UnderlineType["WAVYHEAVY"] = "wavyHeavy";
    UnderlineType["WAVYDOUBLE"] = "wavyDouble";
})(UnderlineType = exports.UnderlineType || (exports.UnderlineType = {}));
class BaseUnderline extends xml_components_1.XmlComponent {
    constructor(underlineType, color) {
        super("w:u");
        this.root.push(new xml_components_1.Attributes({
            val: underlineType,
            color: color,
        }));
    }
}
exports.BaseUnderline = BaseUnderline;
class Underline extends BaseUnderline {
    constructor(underlineType = UnderlineType.SINGLE, color) {
        super(underlineType, color);
    }
}
exports.Underline = Underline;
class DashUnderline extends BaseUnderline {
    constructor() {
        super("dash");
    }
}
exports.DashUnderline = DashUnderline;
class DashDotDotHeavyUnderline extends BaseUnderline {
    constructor() {
        super("dashDotDotHeavy");
    }
}
exports.DashDotDotHeavyUnderline = DashDotDotHeavyUnderline;
class DashDotHeavyUnderline extends BaseUnderline {
    constructor() {
        super("dashDotHeavy");
    }
}
exports.DashDotHeavyUnderline = DashDotHeavyUnderline;
class DashLongUnderline extends BaseUnderline {
    constructor() {
        super("dashLong");
    }
}
exports.DashLongUnderline = DashLongUnderline;
class DashLongHeavyUnderline extends BaseUnderline {
    constructor() {
        super("dashLongHeavy");
    }
}
exports.DashLongHeavyUnderline = DashLongHeavyUnderline;
class DotDashUnderline extends BaseUnderline {
    constructor() {
        super("dotDash");
    }
}
exports.DotDashUnderline = DotDashUnderline;
class DotDotDashUnderline extends BaseUnderline {
    constructor() {
        super("dotDotDash");
    }
}
exports.DotDotDashUnderline = DotDotDashUnderline;
class DottedUnderline extends BaseUnderline {
    constructor() {
        super("dotted");
    }
}
exports.DottedUnderline = DottedUnderline;
class DottedHeavyUnderline extends BaseUnderline {
    constructor() {
        super("dottedHeavy");
    }
}
exports.DottedHeavyUnderline = DottedHeavyUnderline;
class DoubleUnderline extends BaseUnderline {
    constructor() {
        super("double");
    }
}
exports.DoubleUnderline = DoubleUnderline;
class SingleUnderline extends BaseUnderline {
    constructor() {
        super("single");
    }
}
exports.SingleUnderline = SingleUnderline;
class ThickUnderline extends BaseUnderline {
    constructor() {
        super("thick");
    }
}
exports.ThickUnderline = ThickUnderline;
class WaveUnderline extends BaseUnderline {
    constructor() {
        super("wave");
    }
}
exports.WaveUnderline = WaveUnderline;
class WavyDoubleUnderline extends BaseUnderline {
    constructor() {
        super("wavyDouble");
    }
}
exports.WavyDoubleUnderline = WavyDoubleUnderline;
class WavyHeavyUnderline extends BaseUnderline {
    constructor() {
        super("wavyHeavy");
    }
}
exports.WavyHeavyUnderline = WavyHeavyUnderline;
class WordsUnderline extends BaseUnderline {
    constructor() {
        super("words");
    }
}
exports.WordsUnderline = WordsUnderline;


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var randomFromSeed = __webpack_require__(200);

var ORIGINAL = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
var alphabet;
var previousSeed;

var shuffled;

function reset() {
    shuffled = false;
}

function setCharacters(_alphabet_) {
    if (!_alphabet_) {
        if (alphabet !== ORIGINAL) {
            alphabet = ORIGINAL;
            reset();
        }
        return;
    }

    if (_alphabet_ === alphabet) {
        return;
    }

    if (_alphabet_.length !== ORIGINAL.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. You submitted ' + _alphabet_.length + ' characters: ' + _alphabet_);
    }

    var unique = _alphabet_.split('').filter(function(item, ind, arr){
       return ind !== arr.lastIndexOf(item);
    });

    if (unique.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. These characters were not unique: ' + unique.join(', '));
    }

    alphabet = _alphabet_;
    reset();
}

function characters(_alphabet_) {
    setCharacters(_alphabet_);
    return alphabet;
}

function setSeed(seed) {
    randomFromSeed.seed(seed);
    if (previousSeed !== seed) {
        reset();
        previousSeed = seed;
    }
}

function shuffle() {
    if (!alphabet) {
        setCharacters(ORIGINAL);
    }

    var sourceArray = alphabet.split('');
    var targetArray = [];
    var r = randomFromSeed.nextValue();
    var characterIndex;

    while (sourceArray.length > 0) {
        r = randomFromSeed.nextValue();
        characterIndex = Math.floor(r * sourceArray.length);
        targetArray.push(sourceArray.splice(characterIndex, 1)[0]);
    }
    return targetArray.join('');
}

function getShuffled() {
    if (shuffled) {
        return shuffled;
    }
    shuffled = shuffle();
    return shuffled;
}

/**
 * lookup shuffled letter
 * @param index
 * @returns {string}
 */
function lookup(index) {
    var alphabetShuffled = getShuffled();
    return alphabetShuffled[index];
}

function get () {
  return alphabet || ORIGINAL;
}

module.exports = {
    get: get,
    characters: characters,
    seed: setSeed,
    lookup: lookup,
    shuffled: getShuffled
};


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const alignment_1 = __webpack_require__(49);
const bidirectional_1 = __webpack_require__(209);
const border_1 = __webpack_require__(60);
const indent_1 = __webpack_require__(61);
const keep_1 = __webpack_require__(62);
const page_break_1 = __webpack_require__(63);
const spacing_1 = __webpack_require__(77);
const style_1 = __webpack_require__(78);
const tab_stop_1 = __webpack_require__(79);
const unordered_list_1 = __webpack_require__(80);
const links_1 = __webpack_require__(34);
class ParagraphProperties extends xml_components_1.IgnoreIfEmptyXmlComponent {
    constructor(options) {
        super("w:pPr");
        if (!options) {
            return;
        }
        if (options.border) {
            this.push(new border_1.Border(options.border));
        }
        if (options.spacing) {
            this.push(new spacing_1.Spacing(options.spacing));
        }
        if (options.outlineLevel !== undefined) {
            this.push(new links_1.OutlineLevel(options.outlineLevel));
        }
        if (options.alignment) {
            this.push(new alignment_1.Alignment(options.alignment));
        }
        if (options.heading) {
            this.push(new style_1.Style(options.heading));
        }
        if (options.bidirectional) {
            this.push(new bidirectional_1.Bidirectional());
        }
        if (options.thematicBreak) {
            this.push(new border_1.ThematicBreak());
        }
        if (options.pageBreakBefore) {
            this.push(new page_break_1.PageBreakBefore());
        }
        if (options.contextualSpacing) {
            this.push(new spacing_1.ContextualSpacing(options.contextualSpacing));
        }
        if (options.indent) {
            this.push(new indent_1.Indent(options.indent));
        }
        if (options.keepLines) {
            this.push(new keep_1.KeepLines());
        }
        if (options.keepNext) {
            this.push(new keep_1.KeepNext());
        }
        if (options.tabStops) {
            for (const tabStop of options.tabStops) {
                this.push(new tab_stop_1.TabStop(tabStop.type, tabStop.position, tabStop.leader));
            }
        }
        if (options.style) {
            this.push(new style_1.Style(options.style));
        }
        if (options.bullet) {
            this.push(new style_1.Style("ListParagraph"));
            this.push(new unordered_list_1.NumberProperties(1, options.bullet.level));
        }
        if (options.numbering) {
            if (!options.numbering.custom) {
                this.push(new style_1.Style("ListParagraph"));
            }
            this.push(new unordered_list_1.NumberProperties(options.numbering.reference, options.numbering.level));
        }
        if (options.rightTabStop) {
            this.push(new tab_stop_1.TabStop(tab_stop_1.TabStopType.RIGHT, options.rightTabStop));
        }
        if (options.leftTabStop) {
            this.push(new tab_stop_1.TabStop(tab_stop_1.TabStopType.LEFT, options.leftTabStop));
        }
    }
    push(item) {
        this.root.push(item);
    }
}
exports.ParagraphProperties = ParagraphProperties;


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(219));
__export(__webpack_require__(40));
__export(__webpack_require__(39));
__export(__webpack_require__(85));


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(1));
__export(__webpack_require__(210));
__export(__webpack_require__(228));
__export(__webpack_require__(284));
__export(__webpack_require__(111));
__export(__webpack_require__(46));
__export(__webpack_require__(67));
__export(__webpack_require__(93));
__export(__webpack_require__(18));
__export(__webpack_require__(285));
__export(__webpack_require__(0));
__export(__webpack_require__(45));
__export(__webpack_require__(42));
__export(__webpack_require__(110));
__export(__webpack_require__(109));


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class BaseXmlComponent {
    constructor(rootKey) {
        this.deleted = false;
        this.rootKey = rootKey;
    }
    get IsDeleted() {
        return this.deleted;
    }
}
exports.BaseXmlComponent = BaseXmlComponent;


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

/*jslint node:true */

var xml2js = __webpack_require__(51);
var xml2json = __webpack_require__(133);
var js2xml = __webpack_require__(59);
var json2xml = __webpack_require__(134);

module.exports = {
  xml2js: xml2js,
  xml2json: xml2json,
  js2xml: js2xml,
  json2xml: json2xml
};


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = $getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  var args = [];
  for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    ReflectApply(this.listener, this.target, args);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(54);
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = __webpack_require__(24);
exports.Duplex = __webpack_require__(4);
exports.Transform = __webpack_require__(58);
exports.PassThrough = __webpack_require__(128);


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process, setImmediate, global) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.



/*<replacement>*/

var pna = __webpack_require__(12);
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = __webpack_require__(11);
util.inherits = __webpack_require__(6);
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: __webpack_require__(127)
};
/*</replacement>*/

/*<replacement>*/
var Stream = __webpack_require__(55);
/*</replacement>*/

/*<replacement>*/

var Buffer = __webpack_require__(13).Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = __webpack_require__(56);

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || __webpack_require__(4);

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || __webpack_require__(4);

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10), __webpack_require__(57).setImmediate, __webpack_require__(3)))

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



/*<replacement>*/

var Buffer = __webpack_require__(13).Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

var isArray = __webpack_require__(27).isArray;

module.exports = {

  copyOptions: function (options) {
    var key, copy = {};
    for (key in options) {
      if (options.hasOwnProperty(key)) {
        copy[key] = options[key];
      }
    }
    return copy;
  },

  ensureFlagExists: function (item, options) {
    if (!(item in options) || typeof options[item] !== 'boolean') {
      options[item] = false;
    }
  },

  ensureSpacesExists: function (options) {
    if (!('spaces' in options) || (typeof options.spaces !== 'number' && typeof options.spaces !== 'string')) {
      options.spaces = 0;
    }
  },

  ensureAlwaysArrayExists: function (options) {
    if (!('alwaysArray' in options) || (typeof options.alwaysArray !== 'boolean' && !isArray(options.alwaysArray))) {
      options.alwaysArray = false;
    }
  },

  ensureKeyExists: function (key, options) {
    if (!(key + 'Key' in options) || typeof options[key + 'Key'] !== 'string') {
      options[key + 'Key'] = options.compact ? '_' + key : key;
    }
  },

  checkFnExists: function (key, options) {
    return key + 'Fn' in options;
  }

};


/***/ }),
/* 27 */
/***/ (function(module, exports) {

module.exports = {

  isArray: function(value) {
    if (Array.isArray) {
      return Array.isArray(value);
    }
    // fallback for older browsers like  IE 8
    return Object.prototype.toString.call( value ) === '[object Array]';
  }

};


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const break_1 = __webpack_require__(138);
const field_1 = __webpack_require__(29);
const page_number_1 = __webpack_require__(139);
const properties_1 = __webpack_require__(7);
const text_1 = __webpack_require__(66);
var PageNumber;
(function (PageNumber) {
    PageNumber["CURRENT"] = "CURRENT";
    PageNumber["TOTAL_PAGES"] = "TOTAL_PAGES";
    PageNumber["TOTAL_PAGES_IN_SECTION"] = "TOTAL_PAGES_IN_SECTION";
})(PageNumber = exports.PageNumber || (exports.PageNumber = {}));
class Run extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:r");
        this.properties = new properties_1.RunProperties(options);
        this.root.push(this.properties);
        if (options.children) {
            for (const child of options.children) {
                if (typeof child === "string") {
                    switch (child) {
                        case PageNumber.CURRENT:
                            this.root.push(new field_1.Begin());
                            this.root.push(new page_number_1.Page());
                            this.root.push(new field_1.Separate());
                            this.root.push(new field_1.End());
                            break;
                        case PageNumber.TOTAL_PAGES:
                            this.root.push(new field_1.Begin());
                            this.root.push(new page_number_1.NumberOfPages());
                            this.root.push(new field_1.Separate());
                            this.root.push(new field_1.End());
                            break;
                        case PageNumber.TOTAL_PAGES_IN_SECTION:
                            this.root.push(new field_1.Begin());
                            this.root.push(new page_number_1.NumberOfPagesSection());
                            this.root.push(new field_1.Separate());
                            this.root.push(new field_1.End());
                            break;
                        default:
                            this.root.push(new text_1.Text(child));
                            break;
                    }
                    continue;
                }
                this.root.push(child);
            }
        }
        else if (options.text) {
            this.root.push(new text_1.Text(options.text));
        }
    }
    break() {
        this.root.splice(1, 0, new break_1.Break());
        return this;
    }
}
exports.Run = Run;


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var FieldCharacterType;
(function (FieldCharacterType) {
    FieldCharacterType["BEGIN"] = "begin";
    FieldCharacterType["END"] = "end";
    FieldCharacterType["SEPARATE"] = "separate";
})(FieldCharacterType || (FieldCharacterType = {}));
class FidCharAttrs extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { type: "w:fldCharType", dirty: "w:dirty" };
    }
}
class Begin extends xml_components_1.XmlComponent {
    constructor(dirty) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: FieldCharacterType.BEGIN, dirty }));
    }
}
exports.Begin = Begin;
class Separate extends xml_components_1.XmlComponent {
    constructor(dirty) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: FieldCharacterType.SEPARATE, dirty }));
    }
}
exports.Separate = Separate;
class End extends xml_components_1.XmlComponent {
    constructor(dirty) {
        super("w:fldChar");
        this.root.push(new FidCharAttrs({ type: FieldCharacterType.END, dirty }));
    }
}
exports.End = End;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var EmphasisMarkType;
(function (EmphasisMarkType) {
    EmphasisMarkType["DOT"] = "dot";
})(EmphasisMarkType = exports.EmphasisMarkType || (exports.EmphasisMarkType = {}));
class BaseEmphasisMark extends xml_components_1.XmlComponent {
    constructor(emphasisMarkType) {
        super("w:em");
        this.root.push(new xml_components_1.Attributes({
            val: emphasisMarkType,
        }));
    }
}
exports.BaseEmphasisMark = BaseEmphasisMark;
class EmphasisMark extends BaseEmphasisMark {
    constructor(emphasisMarkType = EmphasisMarkType.DOT) {
        super(emphasisMarkType);
    }
}
exports.EmphasisMark = EmphasisMark;
class DotEmphasisMark extends BaseEmphasisMark {
    constructor() {
        super(EmphasisMarkType.DOT);
    }
}
exports.DotEmphasisMark = DotEmphasisMark;


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class RunFontAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            ascii: "w:ascii",
            cs: "w:cs",
            eastAsia: "w:eastAsia",
            hAnsi: "w:hAnsi",
            hint: "w:hint",
        };
    }
}
class RunFonts extends xml_components_1.XmlComponent {
    constructor(nameOrAttrs, hint) {
        super("w:rFonts");
        if (typeof nameOrAttrs === "string") {
            const name = nameOrAttrs;
            this.root.push(new RunFontAttributes({
                ascii: name,
                cs: name,
                eastAsia: name,
                hAnsi: name,
                hint: hint,
            }));
        }
        else {
            const attrs = nameOrAttrs;
            this.root.push(new RunFontAttributes(attrs));
        }
    }
}
exports.RunFonts = RunFonts;


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var HorizontalPositionRelativeFrom;
(function (HorizontalPositionRelativeFrom) {
    HorizontalPositionRelativeFrom["CHARACTER"] = "character";
    HorizontalPositionRelativeFrom["COLUMN"] = "column";
    HorizontalPositionRelativeFrom["INSIDE_MARGIN"] = "insideMargin";
    HorizontalPositionRelativeFrom["LEFT_MARGIN"] = "leftMargin";
    HorizontalPositionRelativeFrom["MARGIN"] = "margin";
    HorizontalPositionRelativeFrom["OUTSIDE_MARGIN"] = "outsideMargin";
    HorizontalPositionRelativeFrom["PAGE"] = "page";
    HorizontalPositionRelativeFrom["RIGHT_MARGIN"] = "rightMargin";
})(HorizontalPositionRelativeFrom = exports.HorizontalPositionRelativeFrom || (exports.HorizontalPositionRelativeFrom = {}));
var VerticalPositionRelativeFrom;
(function (VerticalPositionRelativeFrom) {
    VerticalPositionRelativeFrom["BOTTOM_MARGIN"] = "bottomMargin";
    VerticalPositionRelativeFrom["INSIDE_MARGIN"] = "insideMargin";
    VerticalPositionRelativeFrom["LINE"] = "line";
    VerticalPositionRelativeFrom["MARGIN"] = "margin";
    VerticalPositionRelativeFrom["OUTSIDE_MARGIN"] = "outsideMargin";
    VerticalPositionRelativeFrom["PAGE"] = "page";
    VerticalPositionRelativeFrom["PARAGRAPH"] = "paragraph";
    VerticalPositionRelativeFrom["TOP_MARGIN"] = "topMargin";
})(VerticalPositionRelativeFrom = exports.VerticalPositionRelativeFrom || (exports.VerticalPositionRelativeFrom = {}));
var HorizontalPositionAlign;
(function (HorizontalPositionAlign) {
    HorizontalPositionAlign["CENTER"] = "center";
    HorizontalPositionAlign["INSIDE"] = "inside";
    HorizontalPositionAlign["LEFT"] = "left";
    HorizontalPositionAlign["OUTSIDE"] = "outside";
    HorizontalPositionAlign["RIGHT"] = "right";
})(HorizontalPositionAlign = exports.HorizontalPositionAlign || (exports.HorizontalPositionAlign = {}));
var VerticalPositionAlign;
(function (VerticalPositionAlign) {
    VerticalPositionAlign["BOTTOM"] = "bottom";
    VerticalPositionAlign["CENTER"] = "center";
    VerticalPositionAlign["INSIDE"] = "inside";
    VerticalPositionAlign["OUTSIDE"] = "outside";
    VerticalPositionAlign["TOP"] = "top";
})(VerticalPositionAlign = exports.VerticalPositionAlign || (exports.VerticalPositionAlign = {}));


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(179));
__export(__webpack_require__(180));
__export(__webpack_require__(181));
__export(__webpack_require__(182));
__export(__webpack_require__(183));


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(196));
__export(__webpack_require__(198));
__export(__webpack_require__(208));


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class CellBorderAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { style: "w:val", size: "w:sz", color: "w:color" };
    }
}
class BaseTableCellBorder extends xml_components_1.XmlComponent {
    setProperties(style, size, color) {
        const attrs = new CellBorderAttributes({
            style: style,
            size: size,
            color: color,
        });
        this.root.push(attrs);
        return this;
    }
}
class TableCellBorders extends xml_components_1.IgnoreIfEmptyXmlComponent {
    constructor() {
        super("w:tcBorders");
    }
    addTopBorder(style, size, color) {
        const top = new BaseTableCellBorder("w:top");
        top.setProperties(style, size, color);
        this.root.push(top);
        return this;
    }
    addStartBorder(style, size, color) {
        const start = new BaseTableCellBorder("w:start");
        start.setProperties(style, size, color);
        this.root.push(start);
        return this;
    }
    addBottomBorder(style, size, color) {
        const bottom = new BaseTableCellBorder("w:bottom");
        bottom.setProperties(style, size, color);
        this.root.push(bottom);
        return this;
    }
    addEndBorder(style, size, color) {
        const end = new BaseTableCellBorder("w:end");
        end.setProperties(style, size, color);
        this.root.push(end);
        return this;
    }
    addLeftBorder(style, size, color) {
        const left = new BaseTableCellBorder("w:left");
        left.setProperties(style, size, color);
        this.root.push(left);
        return this;
    }
    addRightBorder(style, size, color) {
        const right = new BaseTableCellBorder("w:right");
        right.setProperties(style, size, color);
        this.root.push(right);
        return this;
    }
}
exports.TableCellBorders = TableCellBorders;
class GridSpanAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val" };
    }
}
class GridSpan extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:gridSpan");
        this.root.push(new GridSpanAttributes({
            val: value,
        }));
    }
}
exports.GridSpan = GridSpan;
var VerticalMergeType;
(function (VerticalMergeType) {
    VerticalMergeType["CONTINUE"] = "continue";
    VerticalMergeType["RESTART"] = "restart";
})(VerticalMergeType = exports.VerticalMergeType || (exports.VerticalMergeType = {}));
class VerticalMergeAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val" };
    }
}
class VerticalMerge extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:vMerge");
        this.root.push(new VerticalMergeAttributes({
            val: value,
        }));
    }
}
exports.VerticalMerge = VerticalMerge;
var VerticalAlign;
(function (VerticalAlign) {
    VerticalAlign["BOTTOM"] = "bottom";
    VerticalAlign["CENTER"] = "center";
    VerticalAlign["TOP"] = "top";
})(VerticalAlign = exports.VerticalAlign || (exports.VerticalAlign = {}));
class VAlignAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val" };
    }
}
class VAlign extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:vAlign");
        this.root.push(new VAlignAttributes({
            val: value,
        }));
    }
}
exports.VAlign = VAlign;
var TextDirection;
(function (TextDirection) {
    TextDirection["BOTTOM_TO_TOP_LEFT_TO_RIGHT"] = "btLr";
    TextDirection["LEFT_TO_RIGHT_TOP_TO_BOTTOM"] = "lrTb";
    TextDirection["TOP_TO_BOTTOM_RIGHT_TO_LEFT"] = "tbRl";
})(TextDirection = exports.TextDirection || (exports.TextDirection = {}));
class TDirectionAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val" };
    }
}
class TDirection extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:textDirection");
        this.root.push(new TDirectionAttributes({
            val: value,
        }));
    }
}
exports.TDirection = TDirection;
var WidthType;
(function (WidthType) {
    WidthType["AUTO"] = "auto";
    WidthType["DXA"] = "dxa";
    WidthType["NIL"] = "nil";
    WidthType["PERCENTAGE"] = "pct";
})(WidthType = exports.WidthType || (exports.WidthType = {}));
class TableCellWidthAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { width: "w:w", type: "w:type" };
    }
}
class TableCellWidth extends xml_components_1.XmlComponent {
    constructor(value, type) {
        super("w:tcW");
        this.root.push(new TableCellWidthAttributes({
            width: value,
            type: type,
        }));
    }
}
exports.TableCellWidth = TableCellWidth;


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(215));


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const components_1 = __webpack_require__(38);
class StyleAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            type: "w:type",
            styleId: "w:styleId",
            default: "w:default",
            customStyle: "w:customStyle",
        };
    }
}
class Style extends xml_components_1.XmlComponent {
    constructor(attributes, name) {
        super("w:style");
        this.root.push(new StyleAttributes(attributes));
        if (name) {
            this.root.push(new components_1.Name(name));
        }
    }
}
exports.Style = Style;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class ComponentAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val" };
    }
}
class Name extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:name");
        this.root.push(new ComponentAttributes({ val: value }));
    }
}
exports.Name = Name;
class BasedOn extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:basedOn");
        this.root.push(new ComponentAttributes({ val: value }));
    }
}
exports.BasedOn = BasedOn;
class Next extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:next");
        this.root.push(new ComponentAttributes({ val: value }));
    }
}
exports.Next = Next;
class Link extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:link");
        this.root.push(new ComponentAttributes({ val: value }));
    }
}
exports.Link = Link;
class UiPriority extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:uiPriority");
        this.root.push(new ComponentAttributes({ val: value }));
    }
}
exports.UiPriority = UiPriority;
class UnhideWhenUsed extends xml_components_1.XmlComponent {
    constructor() {
        super("w:unhideWhenUsed");
    }
}
exports.UnhideWhenUsed = UnhideWhenUsed;
class QuickFormat extends xml_components_1.XmlComponent {
    constructor() {
        super("w:qFormat");
    }
}
exports.QuickFormat = QuickFormat;
class TableProperties extends xml_components_1.XmlComponent {
}
exports.TableProperties = TableProperties;
class RsId extends xml_components_1.XmlComponent {
}
exports.RsId = RsId;
class SemiHidden extends xml_components_1.XmlComponent {
    constructor() {
        super("w:semiHidden");
    }
}
exports.SemiHidden = SemiHidden;


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const paragraph_1 = __webpack_require__(1);
const properties_1 = __webpack_require__(7);
const components_1 = __webpack_require__(38);
const style_1 = __webpack_require__(37);
class ParagraphStyle extends style_1.Style {
    constructor(options) {
        super({ type: "paragraph", styleId: options.id }, options.name);
        this.paragraphProperties = new paragraph_1.ParagraphProperties(options.paragraph);
        this.runProperties = new properties_1.RunProperties(options.run);
        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);
        if (options.basedOn) {
            this.root.push(new components_1.BasedOn(options.basedOn));
        }
        if (options.next) {
            this.root.push(new components_1.Next(options.next));
        }
        if (options.quickFormat) {
            this.root.push(new components_1.QuickFormat());
        }
        if (options.link) {
            this.root.push(new components_1.Link(options.link));
        }
        if (options.semiHidden) {
            this.root.push(new components_1.SemiHidden());
        }
        if (options.uiPriority) {
            this.root.push(new components_1.UiPriority(options.uiPriority));
        }
        if (options.unhideWhenUsed) {
            this.root.push(new components_1.UnhideWhenUsed());
        }
    }
}
exports.ParagraphStyle = ParagraphStyle;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const properties_1 = __webpack_require__(7);
const components_1 = __webpack_require__(38);
const style_1 = __webpack_require__(37);
class CharacterStyle extends style_1.Style {
    constructor(options) {
        super({ type: "character", styleId: options.id }, options.name);
        this.runProperties = new properties_1.RunProperties(options.run);
        this.root.push(this.runProperties);
        this.root.push(new components_1.UiPriority(99));
        this.root.push(new components_1.UnhideWhenUsed());
        if (options.basedOn) {
            this.root.push(new components_1.BasedOn(options.basedOn));
        }
        if (options.link) {
            this.root.push(new components_1.Link(options.link));
        }
        if (options.semiHidden) {
            this.root.push(new components_1.SemiHidden());
        }
    }
}
exports.CharacterStyle = CharacterStyle;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var PageOrientation;
(function (PageOrientation) {
    PageOrientation["PORTRAIT"] = "portrait";
    PageOrientation["LANDSCAPE"] = "landscape";
})(PageOrientation = exports.PageOrientation || (exports.PageOrientation = {}));
class PageSizeAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            width: "w:w",
            height: "w:h",
            orientation: "w:orient",
        };
    }
}
exports.PageSizeAttributes = PageSizeAttributes;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const footer_1 = __webpack_require__(255);
const relationships_1 = __webpack_require__(43);
class FooterWrapper {
    constructor(media, referenceId, initContent) {
        this.media = media;
        this.footer = new footer_1.Footer(referenceId, initContent);
        this.relationships = new relationships_1.Relationships();
    }
    add(item) {
        this.footer.add(item);
    }
    addChildElement(childElement) {
        this.footer.addChildElement(childElement);
    }
    get Footer() {
        return this.footer;
    }
    get Relationships() {
        return this.relationships;
    }
    get Media() {
        return this.media;
    }
}
exports.FooterWrapper = FooterWrapper;


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(257));


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const relationship_attributes_1 = __webpack_require__(259);
var TargetModeType;
(function (TargetModeType) {
    TargetModeType["EXTERNAL"] = "External";
})(TargetModeType = exports.TargetModeType || (exports.TargetModeType = {}));
class Relationship extends xml_components_1.XmlComponent {
    constructor(id, type, target, targetMode) {
        super("Relationship");
        this.root.push(new relationship_attributes_1.RelationshipAttributes({
            id,
            type,
            target,
            targetMode,
        }));
    }
}
exports.Relationship = Relationship;


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const header_1 = __webpack_require__(273);
const relationships_1 = __webpack_require__(43);
class HeaderWrapper {
    constructor(media, referenceId, initContent) {
        this.media = media;
        this.header = new header_1.Header(referenceId, initContent);
        this.relationships = new relationships_1.Relationships();
    }
    add(item) {
        this.header.add(item);
        return this;
    }
    addChildElement(childElement) {
        this.header.addChildElement(childElement);
    }
    get Header() {
        return this.header;
    }
    get Relationships() {
        return this.relationships;
    }
    get Media() {
        return this.media;
    }
}
exports.HeaderWrapper = HeaderWrapper;


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(275));
__export(__webpack_require__(276));


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const formatting_1 = __webpack_require__(48);
const properties_1 = __webpack_require__(17);
const properties_2 = __webpack_require__(7);
class LevelAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            ilvl: "w:ilvl",
            tentative: "w15:tentative",
        };
    }
}
class Start extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:start");
        this.root.push(new xml_components_1.Attributes({
            val: value,
        }));
    }
}
class NumberFormat extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:numFmt");
        this.root.push(new xml_components_1.Attributes({
            val: value,
        }));
    }
}
class LevelText extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:lvlText");
        this.root.push(new xml_components_1.Attributes({
            val: value,
        }));
    }
}
class LevelJc extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:lvlJc");
        this.root.push(new xml_components_1.Attributes({
            val: value,
        }));
    }
}
var LevelSuffix;
(function (LevelSuffix) {
    LevelSuffix["NOTHING"] = "nothing";
    LevelSuffix["SPACE"] = "space";
    LevelSuffix["TAB"] = "tab";
})(LevelSuffix = exports.LevelSuffix || (exports.LevelSuffix = {}));
class Suffix extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:suff");
        this.root.push(new xml_components_1.Attributes({
            val: value,
        }));
    }
}
class LevelBase extends xml_components_1.XmlComponent {
    constructor({ level, format, text, alignment = formatting_1.AlignmentType.START, start = 1, style, suffix }) {
        super("w:lvl");
        this.root.push(new LevelAttributes({
            ilvl: level,
            tentative: 1,
        }));
        this.root.push(new Start(start));
        this.root.push(new LevelJc(alignment));
        if (format) {
            this.root.push(new NumberFormat(format));
        }
        if (text) {
            this.root.push(new LevelText(text));
        }
        this.paragraphProperties = new properties_1.ParagraphProperties(style && style.paragraph);
        this.runProperties = new properties_2.RunProperties(style && style.run);
        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);
        if (suffix) {
            this.root.push(new Suffix(suffix));
        }
    }
}
exports.LevelBase = LevelBase;
class Level extends LevelBase {
    constructor(options) {
        super(options);
    }
}
exports.Level = Level;
class LevelForOverride extends LevelBase {
}
exports.LevelForOverride = LevelForOverride;


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(49));
__export(__webpack_require__(60));
__export(__webpack_require__(61));
__export(__webpack_require__(62));
__export(__webpack_require__(63));
__export(__webpack_require__(77));
__export(__webpack_require__(78));
__export(__webpack_require__(79));
__export(__webpack_require__(80));


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var AlignmentType;
(function (AlignmentType) {
    AlignmentType["START"] = "start";
    AlignmentType["END"] = "end";
    AlignmentType["CENTER"] = "center";
    AlignmentType["BOTH"] = "both";
    AlignmentType["JUSTIFIED"] = "both";
    AlignmentType["DISTRIBUTE"] = "distribute";
    AlignmentType["LEFT"] = "left";
    AlignmentType["RIGHT"] = "right";
})(AlignmentType = exports.AlignmentType || (exports.AlignmentType = {}));
class AlignmentAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val" };
    }
}
exports.AlignmentAttributes = AlignmentAttributes;
class Alignment extends xml_components_1.XmlComponent {
    constructor(type) {
        super("w:jc");
        this.root.push(new AlignmentAttributes({ val: type }));
    }
}
exports.Alignment = Alignment;


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = __webpack_require__(20);
class XmlAttributeComponent extends base_1.BaseXmlComponent {
    constructor(properties) {
        super("_attr");
        this.root = properties;
    }
    prepForXml() {
        const attrs = {};
        Object.keys(this.root).forEach((key) => {
            const value = this.root[key];
            if (value !== undefined) {
                const newKey = (this.xmlKeys && this.xmlKeys[key]) || key;
                attrs[newKey] = value;
            }
        });
        return { _attr: attrs };
    }
    set(properties) {
        this.root = properties;
    }
}
exports.XmlAttributeComponent = XmlAttributeComponent;


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

var sax = __webpack_require__(120);
var expat /*= require('node-expat');*/ = { on: function () { }, parse: function () { } };
var helper = __webpack_require__(26);
var isArray = __webpack_require__(27).isArray;

var options;
var pureJsParser = true;
var currentElement;

function validateOptions(userOptions) {
  options = helper.copyOptions(userOptions);
  helper.ensureFlagExists('ignoreDeclaration', options);
  helper.ensureFlagExists('ignoreInstruction', options);
  helper.ensureFlagExists('ignoreAttributes', options);
  helper.ensureFlagExists('ignoreText', options);
  helper.ensureFlagExists('ignoreComment', options);
  helper.ensureFlagExists('ignoreCdata', options);
  helper.ensureFlagExists('ignoreDoctype', options);
  helper.ensureFlagExists('compact', options);
  helper.ensureFlagExists('alwaysChildren', options);
  helper.ensureFlagExists('addParent', options);
  helper.ensureFlagExists('trim', options);
  helper.ensureFlagExists('nativeType', options);
  helper.ensureFlagExists('nativeTypeAttributes', options);
  helper.ensureFlagExists('sanitize', options);
  helper.ensureFlagExists('instructionHasAttributes', options);
  helper.ensureFlagExists('captureSpacesBetweenElements', options);
  helper.ensureAlwaysArrayExists(options);
  helper.ensureKeyExists('declaration', options);
  helper.ensureKeyExists('instruction', options);
  helper.ensureKeyExists('attributes', options);
  helper.ensureKeyExists('text', options);
  helper.ensureKeyExists('comment', options);
  helper.ensureKeyExists('cdata', options);
  helper.ensureKeyExists('doctype', options);
  helper.ensureKeyExists('type', options);
  helper.ensureKeyExists('name', options);
  helper.ensureKeyExists('elements', options);
  helper.ensureKeyExists('parent', options);
  helper.checkFnExists('doctype', options);
  helper.checkFnExists('instruction', options);
  helper.checkFnExists('cdata', options);
  helper.checkFnExists('comment', options);
  helper.checkFnExists('text', options);
  helper.checkFnExists('instructionName', options);
  helper.checkFnExists('elementName', options);
  helper.checkFnExists('attributeName', options);
  helper.checkFnExists('attributeValue', options);
  helper.checkFnExists('attributes', options);
  return options;
}

function nativeType(value) {
  var nValue = Number(value);
  if (!isNaN(nValue)) {
    return nValue;
  }
  var bValue = value.toLowerCase();
  if (bValue === 'true') {
    return true;
  } else if (bValue === 'false') {
    return false;
  }
  return value;
}

function addField(type, value) {
  var key;
  if (options.compact) {
    if (
      !currentElement[options[type + 'Key']] &&
      (isArray(options.alwaysArray) ? options.alwaysArray.indexOf(options[type + 'Key']) !== -1 : options.alwaysArray)
    ) {
      currentElement[options[type + 'Key']] = [];
    }
    if (currentElement[options[type + 'Key']] && !isArray(currentElement[options[type + 'Key']])) {
      currentElement[options[type + 'Key']] = [currentElement[options[type + 'Key']]];
    }
    if (type + 'Fn' in options && typeof value === 'string') {
      value = options[type + 'Fn'](value, currentElement);
    }
    if (type === 'instruction' && ('instructionFn' in options || 'instructionNameFn' in options)) {
      for (key in value) {
        if (value.hasOwnProperty(key)) {
          if ('instructionFn' in options) {
            value[key] = options.instructionFn(value[key], key, currentElement);
          } else {
            var temp = value[key];
            delete value[key];
            value[options.instructionNameFn(key, temp, currentElement)] = temp;
          }
        }
      }
    }
    if (isArray(currentElement[options[type + 'Key']])) {
      currentElement[options[type + 'Key']].push(value);
    } else {
      currentElement[options[type + 'Key']] = value;
    }
  } else {
    if (!currentElement[options.elementsKey]) {
      currentElement[options.elementsKey] = [];
    }
    var element = {};
    element[options.typeKey] = type;
    if (type === 'instruction') {
      for (key in value) {
        if (value.hasOwnProperty(key)) {
          break;
        }
      }
      element[options.nameKey] = 'instructionNameFn' in options ? options.instructionNameFn(key, value, currentElement) : key;
      if (options.instructionHasAttributes) {
        element[options.attributesKey] = value[key][options.attributesKey];
        if ('instructionFn' in options) {
          element[options.attributesKey] = options.instructionFn(element[options.attributesKey], key, currentElement);
        }
      } else {
        if ('instructionFn' in options) {
          value[key] = options.instructionFn(value[key], key, currentElement);
        }
        element[options.instructionKey] = value[key];
      }
    } else {
      if (type + 'Fn' in options) {
        value = options[type + 'Fn'](value, currentElement);
      }
      element[options[type + 'Key']] = value;
    }
    if (options.addParent) {
      element[options.parentKey] = currentElement;
    }
    currentElement[options.elementsKey].push(element);
  }
}

function manipulateAttributes(attributes) {
  if ('attributesFn' in options && attributes) {
    attributes = options.attributesFn(attributes, currentElement);
  }
  if ((options.trim || 'attributeValueFn' in options || 'attributeNameFn' in options || options.nativeTypeAttributes) && attributes) {
    var key;
    for (key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        if (options.trim) attributes[key] = attributes[key].trim();
        if (options.nativeTypeAttributes) {
          attributes[key] = nativeType(attributes[key]);
        }
        if ('attributeValueFn' in options) attributes[key] = options.attributeValueFn(attributes[key], key, currentElement);
        if ('attributeNameFn' in options) {
          var temp = attributes[key];
          delete attributes[key];
          attributes[options.attributeNameFn(key, attributes[key], currentElement)] = temp;
        }
      }
    }
  }
  return attributes;
}

function onInstruction(instruction) {
  var attributes = {};
  if (instruction.body && (instruction.name.toLowerCase() === 'xml' || options.instructionHasAttributes)) {
    var attrsRegExp = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\w+))\s*/g;
    var match;
    while ((match = attrsRegExp.exec(instruction.body)) !== null) {
      attributes[match[1]] = match[2] || match[3] || match[4];
    }
    attributes = manipulateAttributes(attributes);
  }
  if (instruction.name.toLowerCase() === 'xml') {
    if (options.ignoreDeclaration) {
      return;
    }
    currentElement[options.declarationKey] = {};
    if (Object.keys(attributes).length) {
      currentElement[options.declarationKey][options.attributesKey] = attributes;
    }
    if (options.addParent) {
      currentElement[options.declarationKey][options.parentKey] = currentElement;
    }
  } else {
    if (options.ignoreInstruction) {
      return;
    }
    if (options.trim) {
      instruction.body = instruction.body.trim();
    }
    var value = {};
    if (options.instructionHasAttributes && Object.keys(attributes).length) {
      value[instruction.name] = {};
      value[instruction.name][options.attributesKey] = attributes;
    } else {
      value[instruction.name] = instruction.body;
    }
    addField('instruction', value);
  }
}

function onStartElement(name, attributes) {
  var element;
  if (typeof name === 'object') {
    attributes = name.attributes;
    name = name.name;
  }
  attributes = manipulateAttributes(attributes);
  if ('elementNameFn' in options) {
    name = options.elementNameFn(name, currentElement);
  }
  if (options.compact) {
    element = {};
    if (!options.ignoreAttributes && attributes && Object.keys(attributes).length) {
      element[options.attributesKey] = {};
      var key;
      for (key in attributes) {
        if (attributes.hasOwnProperty(key)) {
          element[options.attributesKey][key] = attributes[key];
        }
      }
    }
    if (
      !(name in currentElement) &&
      (isArray(options.alwaysArray) ? options.alwaysArray.indexOf(name) !== -1 : options.alwaysArray)
    ) {
      currentElement[name] = [];
    }
    if (currentElement[name] && !isArray(currentElement[name])) {
      currentElement[name] = [currentElement[name]];
    }
    if (isArray(currentElement[name])) {
      currentElement[name].push(element);
    } else {
      currentElement[name] = element;
    }
  } else {
    if (!currentElement[options.elementsKey]) {
      currentElement[options.elementsKey] = [];
    }
    element = {};
    element[options.typeKey] = 'element';
    element[options.nameKey] = name;
    if (!options.ignoreAttributes && attributes && Object.keys(attributes).length) {
      element[options.attributesKey] = attributes;
    }
    if (options.alwaysChildren) {
      element[options.elementsKey] = [];
    }
    currentElement[options.elementsKey].push(element);
  }
  element[options.parentKey] = currentElement; // will be deleted in onEndElement() if !options.addParent
  currentElement = element;
}

function onText(text) {
  if (options.ignoreText) {
    return;
  }
  if (!text.trim() && !options.captureSpacesBetweenElements) {
    return;
  }
  if (options.trim) {
    text = text.trim();
  }
  if (options.nativeType) {
    text = nativeType(text);
  }
  if (options.sanitize) {
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  addField('text', text);
}

function onComment(comment) {
  if (options.ignoreComment) {
    return;
  }
  if (options.trim) {
    comment = comment.trim();
  }
  addField('comment', comment);
}

function onEndElement(name) {
  var parentElement = currentElement[options.parentKey];
  if (!options.addParent) {
    delete currentElement[options.parentKey];
  }
  currentElement = parentElement;
}

function onCdata(cdata) {
  if (options.ignoreCdata) {
    return;
  }
  if (options.trim) {
    cdata = cdata.trim();
  }
  addField('cdata', cdata);
}

function onDoctype(doctype) {
  if (options.ignoreDoctype) {
    return;
  }
  doctype = doctype.replace(/^ /, '');
  if (options.trim) {
    doctype = doctype.trim();
  }
  addField('doctype', doctype);
}

function onError(error) {
  error.note = error; //console.error(error);
}

module.exports = function (xml, userOptions) {

  var parser = pureJsParser ? sax.parser(true, {}) : parser = new expat.Parser('UTF-8');
  var result = {};
  currentElement = result;

  options = validateOptions(userOptions);

  if (pureJsParser) {
    parser.opt = {strictEntities: true};
    parser.onopentag = onStartElement;
    parser.ontext = onText;
    parser.oncomment = onComment;
    parser.onclosetag = onEndElement;
    parser.onerror = onError;
    parser.oncdata = onCdata;
    parser.ondoctype = onDoctype;
    parser.onprocessinginstruction = onInstruction;
  } else {
    parser.on('startElement', onStartElement);
    parser.on('text', onText);
    parser.on('comment', onComment);
    parser.on('endElement', onEndElement);
    parser.on('error', onError);
    //parser.on('startCdata', onStartCdata);
    //parser.on('endCdata', onEndCdata);
    //parser.on('entityDecl', onEntityDecl);
  }

  if (pureJsParser) {
    parser.write(xml).close();
  } else {
    if (!parser.parse(xml)) {
      throw new Error('XML parsing error: ' + parser.getError());
    }
  }

  if (result[options.elementsKey]) {
    var temp = result[options.elementsKey];
    delete result[options.elementsKey];
    result[options.elementsKey] = temp;
    delete result.text;
  }

  return result;

};


/***/ }),
/* 52 */
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = __webpack_require__(22).EventEmitter;
var inherits = __webpack_require__(6);

inherits(Stream, EE);
Stream.Readable = __webpack_require__(23);
Stream.Writable = __webpack_require__(129);
Stream.Duplex = __webpack_require__(130);
Stream.Transform = __webpack_require__(131);
Stream.PassThrough = __webpack_require__(132);

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



/*<replacement>*/

var pna = __webpack_require__(12);
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = __webpack_require__(52);
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = __webpack_require__(22).EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = __webpack_require__(55);
/*</replacement>*/

/*<replacement>*/

var Buffer = __webpack_require__(13).Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = __webpack_require__(11);
util.inherits = __webpack_require__(6);
/*</replacement>*/

/*<replacement>*/
var debugUtil = __webpack_require__(123);
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = __webpack_require__(124);
var destroyImpl = __webpack_require__(56);
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || __webpack_require__(4);

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = __webpack_require__(25).StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || __webpack_require__(4);

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = __webpack_require__(25).StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3), __webpack_require__(10)))

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(22).EventEmitter;


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*<replacement>*/

var pna = __webpack_require__(12);
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};

/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {var scope = (typeof global !== "undefined" && global) ||
            (typeof self !== "undefined" && self) ||
            window;
var apply = Function.prototype.apply;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, scope, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, scope, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) {
  if (timeout) {
    timeout.close();
  }
};

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(scope, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// setimmediate attaches itself to the global object
__webpack_require__(126);
// On some exotic environments, it's not clear which object `setimmediate` was
// able to install onto.  Search each possibility in the same order as the
// `setimmediate` library.
exports.setImmediate = (typeof self !== "undefined" && self.setImmediate) ||
                       (typeof global !== "undefined" && global.setImmediate) ||
                       (this && this.setImmediate);
exports.clearImmediate = (typeof self !== "undefined" && self.clearImmediate) ||
                         (typeof global !== "undefined" && global.clearImmediate) ||
                         (this && this.clearImmediate);

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.



module.exports = Transform;

var Duplex = __webpack_require__(4);

/*<replacement>*/
var util = __webpack_require__(11);
util.inherits = __webpack_require__(6);
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}

/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

var helper = __webpack_require__(26);
var isArray = __webpack_require__(27).isArray;

var currentElement, currentElementName;

function validateOptions(userOptions) {
  var options = helper.copyOptions(userOptions);
  helper.ensureFlagExists('ignoreDeclaration', options);
  helper.ensureFlagExists('ignoreInstruction', options);
  helper.ensureFlagExists('ignoreAttributes', options);
  helper.ensureFlagExists('ignoreText', options);
  helper.ensureFlagExists('ignoreComment', options);
  helper.ensureFlagExists('ignoreCdata', options);
  helper.ensureFlagExists('ignoreDoctype', options);
  helper.ensureFlagExists('compact', options);
  helper.ensureFlagExists('indentText', options);
  helper.ensureFlagExists('indentCdata', options);
  helper.ensureFlagExists('indentAttributes', options);
  helper.ensureFlagExists('indentInstruction', options);
  helper.ensureFlagExists('fullTagEmptyElement', options);
  helper.ensureFlagExists('noQuotesForNativeAttributes', options);
  helper.ensureSpacesExists(options);
  if (typeof options.spaces === 'number') {
    options.spaces = Array(options.spaces + 1).join(' ');
  }
  helper.ensureKeyExists('declaration', options);
  helper.ensureKeyExists('instruction', options);
  helper.ensureKeyExists('attributes', options);
  helper.ensureKeyExists('text', options);
  helper.ensureKeyExists('comment', options);
  helper.ensureKeyExists('cdata', options);
  helper.ensureKeyExists('doctype', options);
  helper.ensureKeyExists('type', options);
  helper.ensureKeyExists('name', options);
  helper.ensureKeyExists('elements', options);
  helper.checkFnExists('doctype', options);
  helper.checkFnExists('instruction', options);
  helper.checkFnExists('cdata', options);
  helper.checkFnExists('comment', options);
  helper.checkFnExists('text', options);
  helper.checkFnExists('instructionName', options);
  helper.checkFnExists('elementName', options);
  helper.checkFnExists('attributeName', options);
  helper.checkFnExists('attributeValue', options);
  helper.checkFnExists('attributes', options);
  helper.checkFnExists('fullTagEmptyElement', options);
  return options;
}

function writeIndentation(options, depth, firstLine) {
  return (!firstLine && options.spaces ? '\n' : '') + Array(depth + 1).join(options.spaces);
}

function writeAttributes(attributes, options, depth) {
  if (options.ignoreAttributes) {
    return '';
  }
  if ('attributesFn' in options) {
    attributes = options.attributesFn(attributes, currentElementName, currentElement);
  }
  var key, attr, attrName, quote, result = [];
  for (key in attributes) {
    if (attributes.hasOwnProperty(key) && attributes[key] !== null && attributes[key] !== undefined) {
      quote = options.noQuotesForNativeAttributes && typeof attributes[key] !== 'string' ? '' : '"';
      attr = '' + attributes[key]; // ensure number and boolean are converted to String
      attr = attr.replace(/"/g, '&quot;');
      attrName = 'attributeNameFn' in options ? options.attributeNameFn(key, attr, currentElementName, currentElement) : key;
      result.push((options.spaces && options.indentAttributes? writeIndentation(options, depth+1, false) : ' '));
      result.push(attrName + '=' + quote + ('attributeValueFn' in options ? options.attributeValueFn(attr, key, currentElementName, currentElement) : attr) + quote);
    }
  }
  if (attributes && Object.keys(attributes).length && options.spaces && options.indentAttributes) {
    result.push(writeIndentation(options, depth, false));
  }
  return result.join('');
}

function writeDeclaration(declaration, options, depth) {
  currentElement = declaration;
  currentElementName = 'xml';
  return options.ignoreDeclaration ? '' :  '<?' + 'xml' + writeAttributes(declaration[options.attributesKey], options, depth) + '?>';
}

function writeInstruction(instruction, options, depth) {
  if (options.ignoreInstruction) {
    return '';
  }
  var key;
  for (key in instruction) {
    if (instruction.hasOwnProperty(key)) {
      break;
    }
  }
  var instructionName = 'instructionNameFn' in options ? options.instructionNameFn(key, instruction[key], currentElementName, currentElement) : key;
  if (typeof instruction[key] === 'object') {
    currentElement = instruction;
    currentElementName = instructionName;
    return '<?' + instructionName + writeAttributes(instruction[key][options.attributesKey], options, depth) + '?>';
  } else {
    var instructionValue = instruction[key] ? instruction[key] : '';
    if ('instructionFn' in options) instructionValue = options.instructionFn(instructionValue, key, currentElementName, currentElement);
    return '<?' + instructionName + (instructionValue ? ' ' + instructionValue : '') + '?>';
  }
}

function writeComment(comment, options) {
  return options.ignoreComment ? '' : '<!--' + ('commentFn' in options ? options.commentFn(comment, currentElementName, currentElement) : comment) + '-->';
}

function writeCdata(cdata, options) {
  return options.ignoreCdata ? '' : '<![CDATA[' + ('cdataFn' in options ? options.cdataFn(cdata, currentElementName, currentElement) : cdata.replace(']]>', ']]]]><![CDATA[>')) + ']]>';
}

function writeDoctype(doctype, options) {
  return options.ignoreDoctype ? '' : '<!DOCTYPE ' + ('doctypeFn' in options ? options.doctypeFn(doctype, currentElementName, currentElement) : doctype) + '>';
}

function writeText(text, options) {
  if (options.ignoreText) return '';
  text = '' + text; // ensure Number and Boolean are converted to String
  text = text.replace(/&amp;/g, '&'); // desanitize to avoid double sanitization
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return 'textFn' in options ? options.textFn(text, currentElementName, currentElement) : text;
}

function hasContent(element, options) {
  var i;
  if (element.elements && element.elements.length) {
    for (i = 0; i < element.elements.length; ++i) {
      switch (element.elements[i][options.typeKey]) {
      case 'text':
        if (options.indentText) {
          return true;
        }
        break; // skip to next key
      case 'cdata':
        if (options.indentCdata) {
          return true;
        }
        break; // skip to next key
      case 'instruction':
        if (options.indentInstruction) {
          return true;
        }
        break; // skip to next key
      case 'doctype':
      case 'comment':
      case 'element':
        return true;
      default:
        return true;
      }
    }
  }
  return false;
}

function writeElement(element, options, depth) {
  currentElement = element;
  currentElementName = element.name;
  var xml = [], elementName = 'elementNameFn' in options ? options.elementNameFn(element.name, element) : element.name;
  xml.push('<' + elementName);
  if (element[options.attributesKey]) {
    xml.push(writeAttributes(element[options.attributesKey], options, depth));
  }
  var withClosingTag = element[options.elementsKey] && element[options.elementsKey].length || element[options.attributesKey] && element[options.attributesKey]['xml:space'] === 'preserve';
  if (!withClosingTag) {
    if ('fullTagEmptyElementFn' in options) {
      withClosingTag = options.fullTagEmptyElementFn(element.name, element);
    } else {
      withClosingTag = options.fullTagEmptyElement;
    }
  }
  if (withClosingTag) {
    xml.push('>');
    if (element[options.elementsKey] && element[options.elementsKey].length) {
      xml.push(writeElements(element[options.elementsKey], options, depth + 1));
      currentElement = element;
      currentElementName = element.name;
    }
    xml.push(options.spaces && hasContent(element, options) ? '\n' + Array(depth + 1).join(options.spaces) : '');
    xml.push('</' + elementName + '>');
  } else {
    xml.push('/>');
  }
  return xml.join('');
}

function writeElements(elements, options, depth, firstLine) {
  return elements.reduce(function (xml, element) {
    var indent = writeIndentation(options, depth, firstLine && !xml);
    switch (element.type) {
    case 'element': return xml + indent + writeElement(element, options, depth);
    case 'comment': return xml + indent + writeComment(element[options.commentKey], options);
    case 'doctype': return xml + indent + writeDoctype(element[options.doctypeKey], options);
    case 'cdata': return xml + (options.indentCdata ? indent : '') + writeCdata(element[options.cdataKey], options);
    case 'text': return xml + (options.indentText ? indent : '') + writeText(element[options.textKey], options);
    case 'instruction':
      var instruction = {};
      instruction[element[options.nameKey]] = element[options.attributesKey] ? element : element[options.instructionKey];
      return xml + (options.indentInstruction ? indent : '') + writeInstruction(instruction, options, depth);
    }
  }, '');
}

function hasContentCompact(element, options, anyContent) {
  var key;
  for (key in element) {
    if (element.hasOwnProperty(key)) {
      switch (key) {
      case options.parentKey:
      case options.attributesKey:
        break; // skip to next key
      case options.textKey:
        if (options.indentText || anyContent) {
          return true;
        }
        break; // skip to next key
      case options.cdataKey:
        if (options.indentCdata || anyContent) {
          return true;
        }
        break; // skip to next key
      case options.instructionKey:
        if (options.indentInstruction || anyContent) {
          return true;
        }
        break; // skip to next key
      case options.doctypeKey:
      case options.commentKey:
        return true;
      default:
        return true;
      }
    }
  }
  return false;
}

function writeElementCompact(element, name, options, depth, indent) {
  currentElement = element;
  currentElementName = name;
  var elementName = 'elementNameFn' in options ? options.elementNameFn(name, element) : name;
  if (typeof element === 'undefined' || element === null || element === '') {
    return 'fullTagEmptyElementFn' in options && options.fullTagEmptyElementFn(name, element) || options.fullTagEmptyElement ? '<' + elementName + '></' + elementName + '>' : '<' + elementName + '/>';
  }
  var xml = [];
  if (name) {
    xml.push('<' + elementName);
    if (typeof element !== 'object') {
      xml.push('>' + writeText(element,options) + '</' + elementName + '>');
      return xml.join('');
    }
    if (element[options.attributesKey]) {
      xml.push(writeAttributes(element[options.attributesKey], options, depth));
    }
    var withClosingTag = hasContentCompact(element, options, true) || element[options.attributesKey] && element[options.attributesKey]['xml:space'] === 'preserve';
    if (!withClosingTag) {
      if ('fullTagEmptyElementFn' in options) {
        withClosingTag = options.fullTagEmptyElementFn(name, element);
      } else {
        withClosingTag = options.fullTagEmptyElement;
      }
    }
    if (withClosingTag) {
      xml.push('>');
    } else {
      xml.push('/>');
      return xml.join('');
    }
  }
  xml.push(writeElementsCompact(element, options, depth + 1, false));
  currentElement = element;
  currentElementName = name;
  if (name) {
    xml.push((indent ? writeIndentation(options, depth, false) : '') + '</' + elementName + '>');
  }
  return xml.join('');
}

function writeElementsCompact(element, options, depth, firstLine) {
  var i, key, nodes, xml = [];
  for (key in element) {
    if (element.hasOwnProperty(key)) {
      nodes = isArray(element[key]) ? element[key] : [element[key]];
      for (i = 0; i < nodes.length; ++i) {
        switch (key) {
        case options.declarationKey: xml.push(writeDeclaration(nodes[i], options, depth)); break;
        case options.instructionKey: xml.push((options.indentInstruction ? writeIndentation(options, depth, firstLine) : '') + writeInstruction(nodes[i], options, depth)); break;
        case options.attributesKey: case options.parentKey: break; // skip
        case options.textKey: xml.push((options.indentText ? writeIndentation(options, depth, firstLine) : '') + writeText(nodes[i], options)); break;
        case options.cdataKey: xml.push((options.indentCdata ? writeIndentation(options, depth, firstLine) : '') + writeCdata(nodes[i], options)); break;
        case options.doctypeKey: xml.push(writeIndentation(options, depth, firstLine) + writeDoctype(nodes[i], options)); break;
        case options.commentKey: xml.push(writeIndentation(options, depth, firstLine) + writeComment(nodes[i], options)); break;
        default: xml.push(writeIndentation(options, depth, firstLine) + writeElementCompact(nodes[i], key, options, depth, hasContentCompact(nodes[i], options)));
        }
        firstLine = firstLine && !xml.length;
      }
    }
  }
  return xml.join('');
}

module.exports = function (js, options) {
  options = validateOptions(options);
  var xml = [];
  currentElement = js;
  currentElementName = '_root_';
  if (options.compact) {
    xml.push(writeElementsCompact(js, options, 0, true));
  } else {
    if (js[options.declarationKey]) {
      xml.push(writeDeclaration(js[options.declarationKey], options, 0));
    }
    if (js[options.elementsKey] && js[options.elementsKey].length) {
      xml.push(writeElements(js[options.elementsKey], options, 0, !xml.length));
    }
  }
  return xml.join('');
};


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const border_attributes_1 = __webpack_require__(137);
class BorderProperty extends xml_components_1.XmlComponent {
    constructor(rootKey, options = { color: "auto", space: 1, value: "single", size: 6 }) {
        super(rootKey);
        const attrs = new border_attributes_1.BorderAttributes({
            color: options.color,
            space: options.space,
            val: options.value,
            sz: options.size,
        });
        this.root.push(attrs);
    }
}
class Border extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:pBdr");
        if (options.top !== undefined) {
            const borderProperty = new BorderProperty("w:top", options.top);
            this.root.push(borderProperty);
        }
        if (options.bottom !== undefined) {
            const borderProperty = new BorderProperty("w:bottom", options.bottom);
            this.root.push(borderProperty);
        }
        if (options.left !== undefined) {
            const borderProperty = new BorderProperty("w:left", options.left);
            this.root.push(borderProperty);
        }
        if (options.right !== undefined) {
            const borderProperty = new BorderProperty("w:right", options.right);
            this.root.push(borderProperty);
        }
    }
}
exports.Border = Border;
class ThematicBreak extends xml_components_1.XmlComponent {
    constructor() {
        super("w:pBdr");
        const bottom = new BorderProperty("w:bottom", {
            color: "auto",
            space: 1,
            value: "single",
            size: 6,
        });
        this.root.push(bottom);
    }
}
exports.ThematicBreak = ThematicBreak;


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class IndentAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            left: "w:left",
            hanging: "w:hanging",
            firstLine: "w:firstLine",
            start: "w:start",
            end: "w:end",
            right: "w:end",
        };
    }
}
class Indent extends xml_components_1.XmlComponent {
    constructor(attrs) {
        super("w:ind");
        this.root.push(new IndentAttributes(attrs));
    }
}
exports.Indent = Indent;


/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class KeepLines extends xml_components_1.XmlComponent {
    constructor() {
        super("w:keepLines");
    }
}
exports.KeepLines = KeepLines;
class KeepNext extends xml_components_1.XmlComponent {
    constructor() {
        super("w:keepNext");
    }
}
exports.KeepNext = KeepNext;


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const run_1 = __webpack_require__(2);
class Break extends xml_components_1.XmlComponent {
    constructor() {
        super("w:br");
        this.root.push(new xml_components_1.Attributes({
            type: "page",
        }));
    }
}
class PageBreak extends run_1.Run {
    constructor() {
        super({});
        this.root.push(new Break());
    }
}
exports.PageBreak = PageBreak;
class PageBreakBefore extends xml_components_1.XmlComponent {
    constructor() {
        super("w:pageBreakBefore");
    }
}
exports.PageBreakBefore = PageBreakBefore;


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class VerticalAlign extends xml_components_1.XmlComponent {
    constructor(type) {
        super("w:vertAlign");
        this.root.push(new xml_components_1.Attributes({
            val: type,
        }));
    }
}
exports.VerticalAlign = VerticalAlign;
class SuperScript extends VerticalAlign {
    constructor() {
        super("superscript");
    }
}
exports.SuperScript = SuperScript;
class SubScript extends VerticalAlign {
    constructor() {
        super("subscript");
    }
}
exports.SubScript = SubScript;


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class StyleAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val" };
    }
}
class Style extends xml_components_1.XmlComponent {
    constructor(styleId) {
        super("w:rStyle");
        this.root.push(new StyleAttributes({ val: styleId }));
    }
}
exports.Style = Style;


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const space_type_1 = __webpack_require__(14);
const xml_components_1 = __webpack_require__(0);
class TextAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { space: "xml:space" };
    }
}
class Text extends xml_components_1.XmlComponent {
    constructor(text) {
        super("w:t");
        this.root.push(new TextAttributes({ space: space_type_1.SpaceType.PRESERVE }));
        this.root.push(text);
    }
}
exports.Text = Text;


/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(145));
__export(__webpack_require__(33));
__export(__webpack_require__(68));


/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(32));
__export(__webpack_require__(148));
__export(__webpack_require__(149));
__export(__webpack_require__(150));


/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class Align extends xml_components_1.XmlComponent {
    constructor(value) {
        super("wp:align");
        this.root.push(value);
    }
}
exports.Align = Align;


/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class PositionOffset extends xml_components_1.XmlComponent {
    constructor(offsetValue) {
        super("wp:posOffset");
        this.root.push(offsetValue.toString());
    }
}
exports.PositionOffset = PositionOffset;


/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(151));


/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const doc_properties_attributes_1 = __webpack_require__(184);
class DocProperties extends xml_components_1.XmlComponent {
    constructor() {
        super("wp:docPr");
        this.root.push(new doc_properties_attributes_1.DocPropertiesAttributes({
            id: 0,
            name: "",
            descr: "",
        }));
    }
}
exports.DocProperties = DocProperties;


/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const effect_extent_attributes_1 = __webpack_require__(185);
class EffectExtent extends xml_components_1.XmlComponent {
    constructor() {
        super("wp:effectExtent");
        this.root.push(new effect_extent_attributes_1.EffectExtentAttributes({
            b: 0,
            l: 0,
            r: 0,
            t: 0,
        }));
    }
}
exports.EffectExtent = EffectExtent;


/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const extent_attributes_1 = __webpack_require__(186);
class Extent extends xml_components_1.XmlComponent {
    constructor(x, y) {
        super("wp:extent");
        this.attributes = new extent_attributes_1.ExtentAttributes({
            cx: x,
            cy: y,
        });
        this.root.push(this.attributes);
    }
    setXY(x, y) {
        this.attributes.set({
            cx: x,
            cy: y,
        });
    }
}
exports.Extent = Extent;


/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const graphic_frame_locks_1 = __webpack_require__(187);
class GraphicFrameProperties extends xml_components_1.XmlComponent {
    constructor() {
        super("wp:cNvGraphicFramePr");
        this.root.push(new graphic_frame_locks_1.GraphicFrameLocks());
    }
}
exports.GraphicFrameProperties = GraphicFrameProperties;


/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class AnchorAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            distT: "distT",
            distB: "distB",
            distL: "distL",
            distR: "distR",
            allowOverlap: "allowOverlap",
            behindDoc: "behindDoc",
            layoutInCell: "layoutInCell",
            locked: "locked",
            relativeHeight: "relativeHeight",
            simplePos: "simplePos",
        };
    }
}
exports.AnchorAttributes = AnchorAttributes;


/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class SpacingAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            after: "w:after",
            before: "w:before",
            line: "w:line",
            lineRule: "w:lineRule",
        };
    }
}
class Spacing extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:spacing");
        this.root.push(new SpacingAttributes(options));
    }
}
exports.Spacing = Spacing;
class ContextualSpacing extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:contextualSpacing");
        this.root.push(new xml_components_1.Attributes({
            val: value === false ? 0 : 1,
        }));
    }
}
exports.ContextualSpacing = ContextualSpacing;


/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var HeadingLevel;
(function (HeadingLevel) {
    HeadingLevel["HEADING_1"] = "Heading1";
    HeadingLevel["HEADING_2"] = "Heading2";
    HeadingLevel["HEADING_3"] = "Heading3";
    HeadingLevel["HEADING_4"] = "Heading4";
    HeadingLevel["HEADING_5"] = "Heading5";
    HeadingLevel["HEADING_6"] = "Heading6";
    HeadingLevel["TITLE"] = "Title";
})(HeadingLevel = exports.HeadingLevel || (exports.HeadingLevel = {}));
class Style extends xml_components_1.XmlComponent {
    constructor(styleId) {
        super("w:pStyle");
        this.root.push(new xml_components_1.Attributes({
            val: styleId,
        }));
    }
}
exports.Style = Style;


/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class TabStop extends xml_components_1.XmlComponent {
    constructor(type, position, leader) {
        super("w:tabs");
        this.root.push(new TabStopItem(type, position, leader));
    }
}
exports.TabStop = TabStop;
var TabStopType;
(function (TabStopType) {
    TabStopType["LEFT"] = "left";
    TabStopType["RIGHT"] = "right";
    TabStopType["CENTER"] = "center";
    TabStopType["BAR"] = "bar";
    TabStopType["CLEAR"] = "clear";
    TabStopType["DECIMAL"] = "decimal";
    TabStopType["END"] = "end";
    TabStopType["NUM"] = "num";
    TabStopType["START"] = "start";
})(TabStopType = exports.TabStopType || (exports.TabStopType = {}));
var LeaderType;
(function (LeaderType) {
    LeaderType["DOT"] = "dot";
    LeaderType["HYPHEN"] = "hyphen";
    LeaderType["MIDDLE_DOT"] = "middleDot";
    LeaderType["NONE"] = "none";
    LeaderType["UNDERSCORE"] = "underscore";
})(LeaderType = exports.LeaderType || (exports.LeaderType = {}));
var TabStopPosition;
(function (TabStopPosition) {
    TabStopPosition[TabStopPosition["MAX"] = 9026] = "MAX";
})(TabStopPosition = exports.TabStopPosition || (exports.TabStopPosition = {}));
class TabAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val", pos: "w:pos", leader: "w:leader" };
    }
}
exports.TabAttributes = TabAttributes;
class TabStopItem extends xml_components_1.XmlComponent {
    constructor(value, position, leader) {
        super("w:tab");
        this.root.push(new TabAttributes({
            val: value,
            pos: position,
            leader,
        }));
    }
}
exports.TabStopItem = TabStopItem;


/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class NumberProperties extends xml_components_1.XmlComponent {
    constructor(numberId, indentLevel) {
        super("w:numPr");
        this.root.push(new IndentLevel(indentLevel));
        this.root.push(new NumberId(numberId));
    }
}
exports.NumberProperties = NumberProperties;
class IndentLevel extends xml_components_1.XmlComponent {
    constructor(level) {
        super("w:ilvl");
        this.root.push(new xml_components_1.Attributes({
            val: level,
        }));
    }
}
class NumberId extends xml_components_1.XmlComponent {
    constructor(id) {
        super("w:numId");
        this.root.push(new xml_components_1.Attributes({
            val: typeof id === "string" ? `{${id}}` : id,
        }));
    }
}


/***/ }),
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

module.exports = __webpack_require__(199);


/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(218));
__export(__webpack_require__(88));
__export(__webpack_require__(90));
__export(__webpack_require__(83));
__export(__webpack_require__(89));


/***/ }),
/* 83 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const styles_1 = __webpack_require__(18);
const xml_components_1 = __webpack_require__(0);
class TableBorders extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:tblBorders");
        if (options.top) {
            this.root.push(new TableBordersElement("w:top", options.top.style, options.top.size, 0, options.top.color));
        }
        else {
            this.root.push(new TableBordersElement("w:top", styles_1.BorderStyle.SINGLE, 4, 0, "auto"));
        }
        if (options.left) {
            this.root.push(new TableBordersElement("w:left", options.left.style, options.left.size, 0, options.left.color));
        }
        else {
            this.root.push(new TableBordersElement("w:left", styles_1.BorderStyle.SINGLE, 4, 0, "auto"));
        }
        if (options.bottom) {
            this.root.push(new TableBordersElement("w:bottom", options.bottom.style, options.bottom.size, 0, options.bottom.color));
        }
        else {
            this.root.push(new TableBordersElement("w:bottom", styles_1.BorderStyle.SINGLE, 4, 0, "auto"));
        }
        if (options.right) {
            this.root.push(new TableBordersElement("w:right", options.right.style, options.right.size, 0, options.right.color));
        }
        else {
            this.root.push(new TableBordersElement("w:right", styles_1.BorderStyle.SINGLE, 4, 0, "auto"));
        }
        if (options.insideHorizontal) {
            this.root.push(new TableBordersElement("w:insideH", options.insideHorizontal.style, options.insideHorizontal.size, 0, options.insideHorizontal.color));
        }
        else {
            this.root.push(new TableBordersElement("w:insideH", styles_1.BorderStyle.SINGLE, 4, 0, "auto"));
        }
        if (options.insideVertical) {
            this.root.push(new TableBordersElement("w:insideV", options.insideVertical.style, options.insideVertical.size, 0, options.insideVertical.color));
        }
        else {
            this.root.push(new TableBordersElement("w:insideV", styles_1.BorderStyle.SINGLE, 4, 0, "auto"));
        }
    }
}
exports.TableBorders = TableBorders;
class TableBordersElement extends xml_components_1.XmlComponent {
    constructor(elementName, value, size, space, color) {
        super(elementName);
        this.root.push(new TableBordersAttributes({
            value,
            size,
            space,
            color,
        }));
    }
}
class TableBordersAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            value: "w:val",
            size: "w:sz",
            space: "w:space",
            color: "w:color",
        };
    }
}


/***/ }),
/* 84 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(37));
__export(__webpack_require__(39));
__export(__webpack_require__(40));
__export(__webpack_require__(220));


/***/ }),
/* 85 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(86));
__export(__webpack_require__(87));
__export(__webpack_require__(223));


/***/ }),
/* 86 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const properties_1 = __webpack_require__(17);
const xml_components_1 = __webpack_require__(0);
class ParagraphPropertiesDefaults extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:pPrDefault");
        this.root.push(new properties_1.ParagraphProperties(options));
    }
}
exports.ParagraphPropertiesDefaults = ParagraphPropertiesDefaults;


/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const properties_1 = __webpack_require__(7);
const xml_components_1 = __webpack_require__(0);
class RunPropertiesDefaults extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:rPrDefault");
        this.properties = new properties_1.RunProperties(options);
        this.root.push(this.properties);
    }
}
exports.RunPropertiesDefaults = RunPropertiesDefaults;


/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const table_overlap_1 = __webpack_require__(89);
var TableAnchorType;
(function (TableAnchorType) {
    TableAnchorType["MARGIN"] = "margin";
    TableAnchorType["PAGE"] = "page";
    TableAnchorType["TEXT"] = "text";
})(TableAnchorType = exports.TableAnchorType || (exports.TableAnchorType = {}));
var RelativeHorizontalPosition;
(function (RelativeHorizontalPosition) {
    RelativeHorizontalPosition["CENTER"] = "center";
    RelativeHorizontalPosition["INSIDE"] = "inside";
    RelativeHorizontalPosition["LEFT"] = "left";
    RelativeHorizontalPosition["OUTSIDE"] = "outside";
    RelativeHorizontalPosition["RIGHT"] = "right";
})(RelativeHorizontalPosition = exports.RelativeHorizontalPosition || (exports.RelativeHorizontalPosition = {}));
var RelativeVerticalPosition;
(function (RelativeVerticalPosition) {
    RelativeVerticalPosition["CENTER"] = "center";
    RelativeVerticalPosition["INSIDE"] = "inside";
    RelativeVerticalPosition["BOTTOM"] = "bottom";
    RelativeVerticalPosition["OUTSIDE"] = "outside";
    RelativeVerticalPosition["INLINE"] = "inline";
    RelativeVerticalPosition["TOP"] = "top";
})(RelativeVerticalPosition = exports.RelativeVerticalPosition || (exports.RelativeVerticalPosition = {}));
class TableFloatOptionsAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            horizontalAnchor: "w:horzAnchor",
            verticalAnchor: "w:vertAnchor",
            absoluteHorizontalPosition: "w:tblpX",
            relativeHorizontalPosition: "w:tblpXSpec",
            absoluteVerticalPosition: "w:tblpY",
            relativeVerticalPosition: "w:tblpYSpec",
            bottomFromText: "w:bottomFromText",
            topFromText: "w:topFromText",
            leftFromText: "w:leftFromText",
            rightFromText: "w:rightFromText",
        };
    }
}
exports.TableFloatOptionsAttributes = TableFloatOptionsAttributes;
class TableFloatProperties extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:tblpPr");
        this.root.push(new TableFloatOptionsAttributes(options));
        if (options.overlap) {
            this.root.push(new table_overlap_1.TableOverlap(options.overlap));
        }
    }
}
exports.TableFloatProperties = TableFloatProperties;


/***/ }),
/* 89 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var OverlapType;
(function (OverlapType) {
    OverlapType["NEVER"] = "never";
    OverlapType["OVERLAP"] = "overlap";
})(OverlapType = exports.OverlapType || (exports.OverlapType = {}));
class TableOverlapAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val" };
    }
}
class TableOverlap extends xml_components_1.XmlComponent {
    constructor(type) {
        super("w:tblOverlap");
        this.root.push(new TableOverlapAttributes({ val: type }));
    }
}
exports.TableOverlap = TableOverlap;


/***/ }),
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var TableLayoutType;
(function (TableLayoutType) {
    TableLayoutType["AUTOFIT"] = "autofit";
    TableLayoutType["FIXED"] = "fixed";
})(TableLayoutType = exports.TableLayoutType || (exports.TableLayoutType = {}));
class TableLayoutAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { type: "w:type" };
    }
}
class TableLayout extends xml_components_1.XmlComponent {
    constructor(type) {
        super("w:tblLayout");
        this.root.push(new TableLayoutAttributes({ type }));
    }
}
exports.TableLayout = TableLayout;


/***/ }),
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const table_row_height_1 = __webpack_require__(92);
const xml_components_1 = __webpack_require__(0);
class TableRowProperties extends xml_components_1.IgnoreIfEmptyXmlComponent {
    constructor() {
        super("w:trPr");
    }
    setCantSplit() {
        this.root.push(new CantSplit());
        return this;
    }
    setTableHeader() {
        this.root.push(new TableHeader());
        return this;
    }
    setHeight(height, rule) {
        this.root.push(new table_row_height_1.TableRowHeight(height, rule));
        return this;
    }
}
exports.TableRowProperties = TableRowProperties;
class CantSplitAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val" };
    }
}
class CantSplit extends xml_components_1.XmlComponent {
    constructor() {
        super("w:cantSplit");
        this.root.push(new CantSplitAttributes({ val: true }));
    }
}
exports.CantSplit = CantSplit;
class TableHeaderAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val" };
    }
}
class TableHeader extends xml_components_1.XmlComponent {
    constructor() {
        super("w:tblHeader");
        this.root.push(new TableHeaderAttributes({ val: true }));
    }
}
exports.TableHeader = TableHeader;


/***/ }),
/* 92 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var HeightRule;
(function (HeightRule) {
    HeightRule["AUTO"] = "auto";
    HeightRule["ATLEAST"] = "atLeast";
    HeightRule["EXACT"] = "exact";
})(HeightRule = exports.HeightRule || (exports.HeightRule = {}));
class TableRowHeightAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { height: "w:val", rule: "w:hRule" };
    }
}
exports.TableRowHeightAttributes = TableRowHeightAttributes;
class TableRowHeight extends xml_components_1.XmlComponent {
    constructor(value, rule) {
        super("w:trHeight");
        this.root.push(new TableRowHeightAttributes({
            height: value,
            rule: rule,
        }));
    }
}
exports.TableRowHeight = TableRowHeight;


/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(240));
__export(__webpack_require__(9));
__export(__webpack_require__(94));


/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(241));
__export(__webpack_require__(108));


/***/ }),
/* 95 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const columns_1 = __webpack_require__(242);
const doc_grid_1 = __webpack_require__(244);
const footer_reference_1 = __webpack_require__(96);
const footer_reference_2 = __webpack_require__(97);
const header_reference_1 = __webpack_require__(99);
const header_reference_2 = __webpack_require__(100);
const line_number_1 = __webpack_require__(102);
const page_border_1 = __webpack_require__(103);
const page_margin_1 = __webpack_require__(248);
const page_number_1 = __webpack_require__(104);
const page_size_1 = __webpack_require__(105);
const page_size_attributes_1 = __webpack_require__(41);
const title_page_1 = __webpack_require__(251);
const vertical_align_1 = __webpack_require__(106);
class SectionProperties extends xml_components_1.XmlComponent {
    constructor(options = { column: {} }) {
        super("w:sectPr");
        const { width = 11906, height = 16838, top = 1440, right = 1440, bottom = 1440, left = 1440, header = 708, footer = 708, gutter = 0, mirror = false, column = {}, linePitch = 360, orientation = page_size_attributes_1.PageOrientation.PORTRAIT, headers, footers, pageNumberFormatType, pageNumberStart, lineNumberCountBy, lineNumberStart, lineNumberRestart, lineNumberDistance, pageBorders, pageBorderTop, pageBorderRight, pageBorderBottom, pageBorderLeft, titlePage = false, verticalAlign, } = options;
        this.options = options;
        this.root.push(new page_size_1.PageSize(width, height, orientation));
        this.root.push(new page_margin_1.PageMargin(top, right, bottom, left, header, footer, gutter, mirror));
        this.root.push(new columns_1.Columns(column.space ? column.space : 708, column.count ? column.count : 1));
        this.root.push(new doc_grid_1.DocumentGrid(linePitch));
        this.addHeaders(headers);
        this.addFooters(footers);
        if (pageNumberStart || pageNumberFormatType) {
            this.root.push(new page_number_1.PageNumberType(pageNumberStart, pageNumberFormatType));
        }
        if (lineNumberCountBy || lineNumberStart || lineNumberRestart || lineNumberDistance) {
            this.root.push(new line_number_1.LineNumberType(lineNumberCountBy, lineNumberStart, lineNumberRestart, lineNumberDistance));
        }
        if (pageBorders || pageBorderTop || pageBorderRight || pageBorderBottom || pageBorderLeft) {
            this.root.push(new page_border_1.PageBorders({
                pageBorders: pageBorders,
                pageBorderTop: pageBorderTop,
                pageBorderRight: pageBorderRight,
                pageBorderBottom: pageBorderBottom,
                pageBorderLeft: pageBorderLeft,
            }));
        }
        if (titlePage) {
            this.root.push(new title_page_1.TitlePage());
        }
        if (verticalAlign) {
            this.root.push(new vertical_align_1.SectionVerticalAlign(verticalAlign));
        }
    }
    addHeaders(headers) {
        if (headers) {
            if (headers.default) {
                this.root.push(new header_reference_2.HeaderReference({
                    headerType: header_reference_1.HeaderReferenceType.DEFAULT,
                    headerId: headers.default.Header.ReferenceId,
                }));
            }
            if (headers.first) {
                this.root.push(new header_reference_2.HeaderReference({
                    headerType: header_reference_1.HeaderReferenceType.FIRST,
                    headerId: headers.first.Header.ReferenceId,
                }));
            }
            if (headers.even) {
                this.root.push(new header_reference_2.HeaderReference({
                    headerType: header_reference_1.HeaderReferenceType.EVEN,
                    headerId: headers.even.Header.ReferenceId,
                }));
            }
        }
    }
    addFooters(footers) {
        if (footers) {
            if (footers.default) {
                this.root.push(new footer_reference_2.FooterReference({
                    footerType: footer_reference_1.FooterReferenceType.DEFAULT,
                    footerId: footers.default.Footer.ReferenceId,
                }));
            }
            if (footers.first) {
                this.root.push(new footer_reference_2.FooterReference({
                    footerType: footer_reference_1.FooterReferenceType.FIRST,
                    footerId: footers.first.Footer.ReferenceId,
                }));
            }
            if (footers.even) {
                this.root.push(new footer_reference_2.FooterReference({
                    footerType: footer_reference_1.FooterReferenceType.EVEN,
                    footerId: footers.even.Footer.ReferenceId,
                }));
            }
        }
    }
    get Options() {
        return this.options;
    }
}
exports.SectionProperties = SectionProperties;


/***/ }),
/* 96 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(97));
__export(__webpack_require__(98));


/***/ }),
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const footer_reference_attributes_1 = __webpack_require__(98);
class FooterReference extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:footerReference");
        this.root.push(new footer_reference_attributes_1.FooterReferenceAttributes({
            type: options.footerType || footer_reference_attributes_1.FooterReferenceType.DEFAULT,
            id: `rId${options.footerId}`,
        }));
    }
}
exports.FooterReference = FooterReference;


/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var FooterReferenceType;
(function (FooterReferenceType) {
    FooterReferenceType["DEFAULT"] = "default";
    FooterReferenceType["FIRST"] = "first";
    FooterReferenceType["EVEN"] = "even";
})(FooterReferenceType = exports.FooterReferenceType || (exports.FooterReferenceType = {}));
class FooterReferenceAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            type: "w:type",
            id: "r:id",
        };
    }
}
exports.FooterReferenceAttributes = FooterReferenceAttributes;


/***/ }),
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(100));
__export(__webpack_require__(101));


/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const header_reference_attributes_1 = __webpack_require__(101);
class HeaderReference extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:headerReference");
        this.root.push(new header_reference_attributes_1.HeaderReferenceAttributes({
            type: options.headerType || header_reference_attributes_1.HeaderReferenceType.DEFAULT,
            id: `rId${options.headerId}`,
        }));
    }
}
exports.HeaderReference = HeaderReference;


/***/ }),
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var HeaderReferenceType;
(function (HeaderReferenceType) {
    HeaderReferenceType["DEFAULT"] = "default";
    HeaderReferenceType["FIRST"] = "first";
    HeaderReferenceType["EVEN"] = "even";
})(HeaderReferenceType = exports.HeaderReferenceType || (exports.HeaderReferenceType = {}));
class HeaderReferenceAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            type: "w:type",
            id: "r:id",
        };
    }
}
exports.HeaderReferenceAttributes = HeaderReferenceAttributes;


/***/ }),
/* 102 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(246));


/***/ }),
/* 103 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(247));


/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(250));


/***/ }),
/* 105 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const page_size_attributes_1 = __webpack_require__(41);
class PageSize extends xml_components_1.XmlComponent {
    constructor(width, height, orientation) {
        super("w:pgSz");
        const flip = orientation === page_size_attributes_1.PageOrientation.LANDSCAPE;
        this.root.push(new page_size_attributes_1.PageSizeAttributes({
            width: flip ? height : width,
            height: flip ? width : height,
            orientation: orientation,
        }));
    }
}
exports.PageSize = PageSize;


/***/ }),
/* 106 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(253));
__export(__webpack_require__(107));


/***/ }),
/* 107 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class SectionVerticalAlignAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            verticalAlign: "w:val",
        };
    }
}
exports.SectionVerticalAlignAttributes = SectionVerticalAlignAttributes;


/***/ }),
/* 108 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(95));
__export(__webpack_require__(96));
__export(__webpack_require__(99));
__export(__webpack_require__(254));
__export(__webpack_require__(104));
__export(__webpack_require__(103));
__export(__webpack_require__(102));
__export(__webpack_require__(106));


/***/ }),
/* 109 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(260));
__export(__webpack_require__(270));


/***/ }),
/* 110 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class Header {
    constructor(options = { children: [] }) {
        this.options = options;
    }
}
exports.Header = Header;
class Footer {
    constructor(options = { children: [] }) {
        this.options = options;
    }
}
exports.Footer = Footer;


/***/ }),
/* 111 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(277));
__export(__webpack_require__(112));
__export(__webpack_require__(47));
__export(__webpack_require__(113));


/***/ }),
/* 112 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const level_1 = __webpack_require__(47);
const multi_level_type_1 = __webpack_require__(278);
class AbstractNumberingAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            abstractNumId: "w:abstractNumId",
            restartNumberingAfterBreak: "w15:restartNumberingAfterBreak",
        };
    }
}
class AbstractNumbering extends xml_components_1.XmlComponent {
    constructor(id, levelOptions) {
        super("w:abstractNum");
        this.root.push(new AbstractNumberingAttributes({
            abstractNumId: id,
            restartNumberingAfterBreak: 0,
        }));
        this.root.push(new multi_level_type_1.MultiLevelType("hybridMultilevel"));
        this.id = id;
        for (const option of levelOptions) {
            this.root.push(new level_1.Level(option));
        }
    }
}
exports.AbstractNumbering = AbstractNumbering;


/***/ }),
/* 113 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const level_1 = __webpack_require__(47);
class AbstractNumId extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:abstractNumId");
        this.root.push(new xml_components_1.Attributes({
            val: value,
        }));
    }
}
class NumAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { numId: "w:numId" };
    }
}
class ConcreteNumbering extends xml_components_1.XmlComponent {
    constructor(numId, abstractNumId, reference) {
        super("w:num");
        this.reference = reference;
        this.root.push(new NumAttributes({
            numId: numId,
        }));
        this.root.push(new AbstractNumId(abstractNumId));
        this.id = numId;
    }
    overrideLevel(num, start) {
        const olvl = new LevelOverride(num, start);
        this.root.push(olvl);
        return olvl;
    }
}
exports.ConcreteNumbering = ConcreteNumbering;
class LevelOverrideAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { ilvl: "w:ilvl" };
    }
}
class LevelOverride extends xml_components_1.XmlComponent {
    constructor(levelNum, start) {
        super("w:lvlOverride");
        this.levelNum = levelNum;
        this.root.push(new LevelOverrideAttributes({ ilvl: levelNum }));
        if (start !== undefined) {
            this.root.push(new StartOverride(start));
        }
        this.lvl = new level_1.LevelForOverride({
            level: this.levelNum,
        });
        this.root.push(this.lvl);
    }
    get Level() {
        return this.lvl;
    }
}
exports.LevelOverride = LevelOverride;
class StartOverrideAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { val: "w:val" };
    }
}
class StartOverride extends xml_components_1.XmlComponent {
    constructor(start) {
        super("w:startOverride");
        this.root.push(new StartOverrideAttributes({ val: start }));
    }
}


/***/ }),
/* 114 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class UpdateFieldsAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            enabled: "w:val",
        };
    }
}
exports.UpdateFieldsAttributes = UpdateFieldsAttributes;
class UpdateFields extends xml_components_1.XmlComponent {
    constructor(enabled = true) {
        super("w:updateFields");
        this.root.push(new UpdateFieldsAttributes({
            enabled,
        }));
    }
}
exports.UpdateFields = UpdateFields;


/***/ }),
/* 115 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer, global, setImmediate) {var require;var require;/*!

JSZip v3.5.0 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/master/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/master/LICENSE
*/

!function(t){if(true)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).JSZip=t()}}(function(){return function s(a,o,h){function u(r,t){if(!o[r]){if(!a[r]){var e="function"==typeof require&&require;if(!t&&e)return require(r,!0);if(l)return l(r,!0);var i=new Error("Cannot find module '"+r+"'");throw i.code="MODULE_NOT_FOUND",i}var n=o[r]={exports:{}};a[r][0].call(n.exports,function(t){var e=a[r][1][t];return u(e||t)},n,n.exports,s,a,o,h)}return o[r].exports}for(var l="function"==typeof require&&require,t=0;t<h.length;t++)u(h[t]);return u}({1:[function(t,e,r){"use strict";var c=t("./utils"),d=t("./support"),p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";r.encode=function(t){for(var e,r,i,n,s,a,o,h=[],u=0,l=t.length,f=l,d="string"!==c.getTypeOf(t);u<t.length;)f=l-u,i=d?(e=t[u++],r=u<l?t[u++]:0,u<l?t[u++]:0):(e=t.charCodeAt(u++),r=u<l?t.charCodeAt(u++):0,u<l?t.charCodeAt(u++):0),n=e>>2,s=(3&e)<<4|r>>4,a=1<f?(15&r)<<2|i>>6:64,o=2<f?63&i:64,h.push(p.charAt(n)+p.charAt(s)+p.charAt(a)+p.charAt(o));return h.join("")},r.decode=function(t){var e,r,i,n,s,a,o=0,h=0,u="data:";if(t.substr(0,u.length)===u)throw new Error("Invalid base64 input, it looks like a data url.");var l,f=3*(t=t.replace(/[^A-Za-z0-9\+\/\=]/g,"")).length/4;if(t.charAt(t.length-1)===p.charAt(64)&&f--,t.charAt(t.length-2)===p.charAt(64)&&f--,f%1!=0)throw new Error("Invalid base64 input, bad content length.");for(l=d.uint8array?new Uint8Array(0|f):new Array(0|f);o<t.length;)e=p.indexOf(t.charAt(o++))<<2|(n=p.indexOf(t.charAt(o++)))>>4,r=(15&n)<<4|(s=p.indexOf(t.charAt(o++)))>>2,i=(3&s)<<6|(a=p.indexOf(t.charAt(o++))),l[h++]=e,64!==s&&(l[h++]=r),64!==a&&(l[h++]=i);return l}},{"./support":30,"./utils":32}],2:[function(t,e,r){"use strict";var i=t("./external"),n=t("./stream/DataWorker"),s=t("./stream/DataLengthProbe"),a=t("./stream/Crc32Probe");s=t("./stream/DataLengthProbe");function o(t,e,r,i,n){this.compressedSize=t,this.uncompressedSize=e,this.crc32=r,this.compression=i,this.compressedContent=n}o.prototype={getContentWorker:function(){var t=new n(i.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new s("data_length")),e=this;return t.on("end",function(){if(this.streamInfo.data_length!==e.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),t},getCompressedWorker:function(){return new n(i.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},o.createWorkerFrom=function(t,e,r){return t.pipe(new a).pipe(new s("uncompressedSize")).pipe(e.compressWorker(r)).pipe(new s("compressedSize")).withStreamInfo("compression",e)},e.exports=o},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(t,e,r){"use strict";var i=t("./stream/GenericWorker");r.STORE={magic:"\0\0",compressWorker:function(t){return new i("STORE compression")},uncompressWorker:function(){return new i("STORE decompression")}},r.DEFLATE=t("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(t,e,r){"use strict";var i=t("./utils");var o=function(){for(var t,e=[],r=0;r<256;r++){t=r;for(var i=0;i<8;i++)t=1&t?3988292384^t>>>1:t>>>1;e[r]=t}return e}();e.exports=function(t,e){return void 0!==t&&t.length?"string"!==i.getTypeOf(t)?function(t,e,r,i){var n=o,s=i+r;t^=-1;for(var a=i;a<s;a++)t=t>>>8^n[255&(t^e[a])];return-1^t}(0|e,t,t.length,0):function(t,e,r,i){var n=o,s=i+r;t^=-1;for(var a=i;a<s;a++)t=t>>>8^n[255&(t^e.charCodeAt(a))];return-1^t}(0|e,t,t.length,0):0}},{"./utils":32}],5:[function(t,e,r){"use strict";r.base64=!1,r.binary=!1,r.dir=!1,r.createFolders=!0,r.date=null,r.compression=null,r.compressionOptions=null,r.comment=null,r.unixPermissions=null,r.dosPermissions=null},{}],6:[function(t,e,r){"use strict";var i=null;i="undefined"!=typeof Promise?Promise:t("lie"),e.exports={Promise:i}},{lie:37}],7:[function(t,e,r){"use strict";var i="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,n=t("pako"),s=t("./utils"),a=t("./stream/GenericWorker"),o=i?"uint8array":"array";function h(t,e){a.call(this,"FlateWorker/"+t),this._pako=null,this._pakoAction=t,this._pakoOptions=e,this.meta={}}r.magic="\b\0",s.inherits(h,a),h.prototype.processChunk=function(t){this.meta=t.meta,null===this._pako&&this._createPako(),this._pako.push(s.transformTo(o,t.data),!1)},h.prototype.flush=function(){a.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],!0)},h.prototype.cleanUp=function(){a.prototype.cleanUp.call(this),this._pako=null},h.prototype._createPako=function(){this._pako=new n[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var e=this;this._pako.onData=function(t){e.push({data:t,meta:e.meta})}},r.compressWorker=function(t){return new h("Deflate",t)},r.uncompressWorker=function(){return new h("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(t,e,r){"use strict";function A(t,e){var r,i="";for(r=0;r<e;r++)i+=String.fromCharCode(255&t),t>>>=8;return i}function i(t,e,r,i,n,s){var a,o,h=t.file,u=t.compression,l=s!==O.utf8encode,f=I.transformTo("string",s(h.name)),d=I.transformTo("string",O.utf8encode(h.name)),c=h.comment,p=I.transformTo("string",s(c)),m=I.transformTo("string",O.utf8encode(c)),_=d.length!==h.name.length,g=m.length!==c.length,b="",v="",y="",w=h.dir,k=h.date,x={crc32:0,compressedSize:0,uncompressedSize:0};e&&!r||(x.crc32=t.crc32,x.compressedSize=t.compressedSize,x.uncompressedSize=t.uncompressedSize);var S=0;e&&(S|=8),l||!_&&!g||(S|=2048);var z=0,C=0;w&&(z|=16),"UNIX"===n?(C=798,z|=function(t,e){var r=t;return t||(r=e?16893:33204),(65535&r)<<16}(h.unixPermissions,w)):(C=20,z|=function(t){return 63&(t||0)}(h.dosPermissions)),a=k.getUTCHours(),a<<=6,a|=k.getUTCMinutes(),a<<=5,a|=k.getUTCSeconds()/2,o=k.getUTCFullYear()-1980,o<<=4,o|=k.getUTCMonth()+1,o<<=5,o|=k.getUTCDate(),_&&(v=A(1,1)+A(B(f),4)+d,b+="up"+A(v.length,2)+v),g&&(y=A(1,1)+A(B(p),4)+m,b+="uc"+A(y.length,2)+y);var E="";return E+="\n\0",E+=A(S,2),E+=u.magic,E+=A(a,2),E+=A(o,2),E+=A(x.crc32,4),E+=A(x.compressedSize,4),E+=A(x.uncompressedSize,4),E+=A(f.length,2),E+=A(b.length,2),{fileRecord:R.LOCAL_FILE_HEADER+E+f+b,dirRecord:R.CENTRAL_FILE_HEADER+A(C,2)+E+A(p.length,2)+"\0\0\0\0"+A(z,4)+A(i,4)+f+b+p}}var I=t("../utils"),n=t("../stream/GenericWorker"),O=t("../utf8"),B=t("../crc32"),R=t("../signature");function s(t,e,r,i){n.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=e,this.zipPlatform=r,this.encodeFileName=i,this.streamFiles=t,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}I.inherits(s,n),s.prototype.push=function(t){var e=t.meta.percent||0,r=this.entriesCount,i=this._sources.length;this.accumulate?this.contentBuffer.push(t):(this.bytesWritten+=t.data.length,n.prototype.push.call(this,{data:t.data,meta:{currentFile:this.currentFile,percent:r?(e+100*(r-i-1))/r:100}}))},s.prototype.openedSource=function(t){this.currentSourceOffset=this.bytesWritten,this.currentFile=t.file.name;var e=this.streamFiles&&!t.file.dir;if(e){var r=i(t,e,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:r.fileRecord,meta:{percent:0}})}else this.accumulate=!0},s.prototype.closedSource=function(t){this.accumulate=!1;var e=this.streamFiles&&!t.file.dir,r=i(t,e,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(r.dirRecord),e)this.push({data:function(t){return R.DATA_DESCRIPTOR+A(t.crc32,4)+A(t.compressedSize,4)+A(t.uncompressedSize,4)}(t),meta:{percent:100}});else for(this.push({data:r.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},s.prototype.flush=function(){for(var t=this.bytesWritten,e=0;e<this.dirRecords.length;e++)this.push({data:this.dirRecords[e],meta:{percent:100}});var r=this.bytesWritten-t,i=function(t,e,r,i,n){var s=I.transformTo("string",n(i));return R.CENTRAL_DIRECTORY_END+"\0\0\0\0"+A(t,2)+A(t,2)+A(e,4)+A(r,4)+A(s.length,2)+s}(this.dirRecords.length,r,t,this.zipComment,this.encodeFileName);this.push({data:i,meta:{percent:100}})},s.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},s.prototype.registerPrevious=function(t){this._sources.push(t);var e=this;return t.on("data",function(t){e.processChunk(t)}),t.on("end",function(){e.closedSource(e.previous.streamInfo),e._sources.length?e.prepareNextSource():e.end()}),t.on("error",function(t){e.error(t)}),this},s.prototype.resume=function(){return!!n.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},s.prototype.error=function(t){var e=this._sources;if(!n.prototype.error.call(this,t))return!1;for(var r=0;r<e.length;r++)try{e[r].error(t)}catch(t){}return!0},s.prototype.lock=function(){n.prototype.lock.call(this);for(var t=this._sources,e=0;e<t.length;e++)t[e].lock()},e.exports=s},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(t,e,r){"use strict";var u=t("../compressions"),i=t("./ZipFileWorker");r.generateWorker=function(t,a,e){var o=new i(a.streamFiles,e,a.platform,a.encodeFileName),h=0;try{t.forEach(function(t,e){h++;var r=function(t,e){var r=t||e,i=u[r];if(!i)throw new Error(r+" is not a valid compression method !");return i}(e.options.compression,a.compression),i=e.options.compressionOptions||a.compressionOptions||{},n=e.dir,s=e.date;e._compressWorker(r,i).withStreamInfo("file",{name:t,dir:n,date:s,comment:e.comment||"",unixPermissions:e.unixPermissions,dosPermissions:e.dosPermissions}).pipe(o)}),o.entriesCount=h}catch(t){o.error(t)}return o}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(t,e,r){"use strict";function i(){if(!(this instanceof i))return new i;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files={},this.comment=null,this.root="",this.clone=function(){var t=new i;for(var e in this)"function"!=typeof this[e]&&(t[e]=this[e]);return t}}(i.prototype=t("./object")).loadAsync=t("./load"),i.support=t("./support"),i.defaults=t("./defaults"),i.version="3.5.0",i.loadAsync=function(t,e){return(new i).loadAsync(t,e)},i.external=t("./external"),e.exports=i},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(t,e,r){"use strict";var i=t("./utils"),n=t("./external"),o=t("./utf8"),h=(i=t("./utils"),t("./zipEntries")),s=t("./stream/Crc32Probe"),u=t("./nodejsUtils");function l(i){return new n.Promise(function(t,e){var r=i.decompressed.getContentWorker().pipe(new s);r.on("error",function(t){e(t)}).on("end",function(){r.streamInfo.crc32!==i.decompressed.crc32?e(new Error("Corrupted zip : CRC32 mismatch")):t()}).resume()})}e.exports=function(t,s){var a=this;return s=i.extend(s||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:o.utf8decode}),u.isNode&&u.isStream(t)?n.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):i.prepareContent("the loaded zip file",t,!0,s.optimizedBinaryString,s.base64).then(function(t){var e=new h(s);return e.load(t),e}).then(function(t){var e=[n.Promise.resolve(t)],r=t.files;if(s.checkCRC32)for(var i=0;i<r.length;i++)e.push(l(r[i]));return n.Promise.all(e)}).then(function(t){for(var e=t.shift(),r=e.files,i=0;i<r.length;i++){var n=r[i];a.file(n.fileNameStr,n.decompressed,{binary:!0,optimizedBinaryString:!0,date:n.date,dir:n.dir,comment:n.fileCommentStr.length?n.fileCommentStr:null,unixPermissions:n.unixPermissions,dosPermissions:n.dosPermissions,createFolders:s.createFolders})}return e.zipComment.length&&(a.comment=e.zipComment),a})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(t,e,r){"use strict";var i=t("../utils"),n=t("../stream/GenericWorker");function s(t,e){n.call(this,"Nodejs stream input adapter for "+t),this._upstreamEnded=!1,this._bindStream(e)}i.inherits(s,n),s.prototype._bindStream=function(t){var e=this;(this._stream=t).pause(),t.on("data",function(t){e.push({data:t,meta:{percent:0}})}).on("error",function(t){e.isPaused?this.generatedError=t:e.error(t)}).on("end",function(){e.isPaused?e._upstreamEnded=!0:e.end()})},s.prototype.pause=function(){return!!n.prototype.pause.call(this)&&(this._stream.pause(),!0)},s.prototype.resume=function(){return!!n.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},e.exports=s},{"../stream/GenericWorker":28,"../utils":32}],13:[function(t,e,r){"use strict";var n=t("readable-stream").Readable;function i(t,e,r){n.call(this,e),this._helper=t;var i=this;t.on("data",function(t,e){i.push(t)||i._helper.pause(),r&&r(e)}).on("error",function(t){i.emit("error",t)}).on("end",function(){i.push(null)})}t("../utils").inherits(i,n),i.prototype._read=function(){this._helper.resume()},e.exports=i},{"../utils":32,"readable-stream":16}],14:[function(t,e,r){"use strict";e.exports={isNode:"undefined"!=typeof Buffer,newBufferFrom:function(t,e){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(t,e);if("number"==typeof t)throw new Error('The "data" argument must not be a number');return new Buffer(t,e)},allocBuffer:function(t){if(Buffer.alloc)return Buffer.alloc(t);var e=new Buffer(t);return e.fill(0),e},isBuffer:function(t){return Buffer.isBuffer(t)},isStream:function(t){return t&&"function"==typeof t.on&&"function"==typeof t.pause&&"function"==typeof t.resume}}},{}],15:[function(t,e,r){"use strict";function s(t,e,r){var i,n=u.getTypeOf(e),s=u.extend(r||{},f);s.date=s.date||new Date,null!==s.compression&&(s.compression=s.compression.toUpperCase()),"string"==typeof s.unixPermissions&&(s.unixPermissions=parseInt(s.unixPermissions,8)),s.unixPermissions&&16384&s.unixPermissions&&(s.dir=!0),s.dosPermissions&&16&s.dosPermissions&&(s.dir=!0),s.dir&&(t=g(t)),s.createFolders&&(i=_(t))&&b.call(this,i,!0);var a="string"===n&&!1===s.binary&&!1===s.base64;r&&void 0!==r.binary||(s.binary=!a),(e instanceof d&&0===e.uncompressedSize||s.dir||!e||0===e.length)&&(s.base64=!1,s.binary=!0,e="",s.compression="STORE",n="string");var o=null;o=e instanceof d||e instanceof l?e:p.isNode&&p.isStream(e)?new m(t,e):u.prepareContent(t,e,s.binary,s.optimizedBinaryString,s.base64);var h=new c(t,o,s);this.files[t]=h}var n=t("./utf8"),u=t("./utils"),l=t("./stream/GenericWorker"),a=t("./stream/StreamHelper"),f=t("./defaults"),d=t("./compressedObject"),c=t("./zipObject"),o=t("./generate"),p=t("./nodejsUtils"),m=t("./nodejs/NodejsStreamInputAdapter"),_=function(t){"/"===t.slice(-1)&&(t=t.substring(0,t.length-1));var e=t.lastIndexOf("/");return 0<e?t.substring(0,e):""},g=function(t){return"/"!==t.slice(-1)&&(t+="/"),t},b=function(t,e){return e=void 0!==e?e:f.createFolders,t=g(t),this.files[t]||s.call(this,t,null,{dir:!0,createFolders:e}),this.files[t]};function h(t){return"[object RegExp]"===Object.prototype.toString.call(t)}var i={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(t){var e,r,i;for(e in this.files)this.files.hasOwnProperty(e)&&(i=this.files[e],(r=e.slice(this.root.length,e.length))&&e.slice(0,this.root.length)===this.root&&t(r,i))},filter:function(r){var i=[];return this.forEach(function(t,e){r(t,e)&&i.push(e)}),i},file:function(t,e,r){if(1!==arguments.length)return t=this.root+t,s.call(this,t,e,r),this;if(h(t)){var i=t;return this.filter(function(t,e){return!e.dir&&i.test(t)})}var n=this.files[this.root+t];return n&&!n.dir?n:null},folder:function(r){if(!r)return this;if(h(r))return this.filter(function(t,e){return e.dir&&r.test(t)});var t=this.root+r,e=b.call(this,t),i=this.clone();return i.root=e.name,i},remove:function(r){r=this.root+r;var t=this.files[r];if(t||("/"!==r.slice(-1)&&(r+="/"),t=this.files[r]),t&&!t.dir)delete this.files[r];else for(var e=this.filter(function(t,e){return e.name.slice(0,r.length)===r}),i=0;i<e.length;i++)delete this.files[e[i].name];return this},generate:function(t){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(t){var e,r={};try{if((r=u.extend(t||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:n.utf8encode})).type=r.type.toLowerCase(),r.compression=r.compression.toUpperCase(),"binarystring"===r.type&&(r.type="string"),!r.type)throw new Error("No output type specified.");u.checkSupport(r.type),"darwin"!==r.platform&&"freebsd"!==r.platform&&"linux"!==r.platform&&"sunos"!==r.platform||(r.platform="UNIX"),"win32"===r.platform&&(r.platform="DOS");var i=r.comment||this.comment||"";e=o.generateWorker(this,r,i)}catch(t){(e=new l("error")).error(t)}return new a(e,r.type||"string",r.mimeType)},generateAsync:function(t,e){return this.generateInternalStream(t).accumulate(e)},generateNodeStream:function(t,e){return(t=t||{}).type||(t.type="nodebuffer"),this.generateInternalStream(t).toNodejsStream(e)}};e.exports=i},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(t,e,r){e.exports=t("stream")},{stream:void 0}],17:[function(t,e,r){"use strict";var i=t("./DataReader");function n(t){i.call(this,t);for(var e=0;e<this.data.length;e++)t[e]=255&t[e]}t("../utils").inherits(n,i),n.prototype.byteAt=function(t){return this.data[this.zero+t]},n.prototype.lastIndexOfSignature=function(t){for(var e=t.charCodeAt(0),r=t.charCodeAt(1),i=t.charCodeAt(2),n=t.charCodeAt(3),s=this.length-4;0<=s;--s)if(this.data[s]===e&&this.data[s+1]===r&&this.data[s+2]===i&&this.data[s+3]===n)return s-this.zero;return-1},n.prototype.readAndCheckSignature=function(t){var e=t.charCodeAt(0),r=t.charCodeAt(1),i=t.charCodeAt(2),n=t.charCodeAt(3),s=this.readData(4);return e===s[0]&&r===s[1]&&i===s[2]&&n===s[3]},n.prototype.readData=function(t){if(this.checkOffset(t),0===t)return[];var e=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n},{"../utils":32,"./DataReader":18}],18:[function(t,e,r){"use strict";var i=t("../utils");function n(t){this.data=t,this.length=t.length,this.index=0,this.zero=0}n.prototype={checkOffset:function(t){this.checkIndex(this.index+t)},checkIndex:function(t){if(this.length<this.zero+t||t<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+t+"). Corrupted zip ?")},setIndex:function(t){this.checkIndex(t),this.index=t},skip:function(t){this.setIndex(this.index+t)},byteAt:function(t){},readInt:function(t){var e,r=0;for(this.checkOffset(t),e=this.index+t-1;e>=this.index;e--)r=(r<<8)+this.byteAt(e);return this.index+=t,r},readString:function(t){return i.transformTo("string",this.readData(t))},readData:function(t){},lastIndexOfSignature:function(t){},readAndCheckSignature:function(t){},readDate:function(){var t=this.readInt(4);return new Date(Date.UTC(1980+(t>>25&127),(t>>21&15)-1,t>>16&31,t>>11&31,t>>5&63,(31&t)<<1))}},e.exports=n},{"../utils":32}],19:[function(t,e,r){"use strict";var i=t("./Uint8ArrayReader");function n(t){i.call(this,t)}t("../utils").inherits(n,i),n.prototype.readData=function(t){this.checkOffset(t);var e=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(t,e,r){"use strict";var i=t("./DataReader");function n(t){i.call(this,t)}t("../utils").inherits(n,i),n.prototype.byteAt=function(t){return this.data.charCodeAt(this.zero+t)},n.prototype.lastIndexOfSignature=function(t){return this.data.lastIndexOf(t)-this.zero},n.prototype.readAndCheckSignature=function(t){return t===this.readData(4)},n.prototype.readData=function(t){this.checkOffset(t);var e=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n},{"../utils":32,"./DataReader":18}],21:[function(t,e,r){"use strict";var i=t("./ArrayReader");function n(t){i.call(this,t)}t("../utils").inherits(n,i),n.prototype.readData=function(t){if(this.checkOffset(t),0===t)return new Uint8Array(0);var e=this.data.subarray(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n},{"../utils":32,"./ArrayReader":17}],22:[function(t,e,r){"use strict";var i=t("../utils"),n=t("../support"),s=t("./ArrayReader"),a=t("./StringReader"),o=t("./NodeBufferReader"),h=t("./Uint8ArrayReader");e.exports=function(t){var e=i.getTypeOf(t);return i.checkSupport(e),"string"!==e||n.uint8array?"nodebuffer"===e?new o(t):n.uint8array?new h(i.transformTo("uint8array",t)):new s(i.transformTo("array",t)):new a(t)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(t,e,r){"use strict";r.LOCAL_FILE_HEADER="PK",r.CENTRAL_FILE_HEADER="PK",r.CENTRAL_DIRECTORY_END="PK",r.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",r.ZIP64_CENTRAL_DIRECTORY_END="PK",r.DATA_DESCRIPTOR="PK\b"},{}],24:[function(t,e,r){"use strict";var i=t("./GenericWorker"),n=t("../utils");function s(t){i.call(this,"ConvertWorker to "+t),this.destType=t}n.inherits(s,i),s.prototype.processChunk=function(t){this.push({data:n.transformTo(this.destType,t.data),meta:t.meta})},e.exports=s},{"../utils":32,"./GenericWorker":28}],25:[function(t,e,r){"use strict";var i=t("./GenericWorker"),n=t("../crc32");function s(){i.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}t("../utils").inherits(s,i),s.prototype.processChunk=function(t){this.streamInfo.crc32=n(t.data,this.streamInfo.crc32||0),this.push(t)},e.exports=s},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(t,e,r){"use strict";var i=t("../utils"),n=t("./GenericWorker");function s(t){n.call(this,"DataLengthProbe for "+t),this.propName=t,this.withStreamInfo(t,0)}i.inherits(s,n),s.prototype.processChunk=function(t){if(t){var e=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=e+t.data.length}n.prototype.processChunk.call(this,t)},e.exports=s},{"../utils":32,"./GenericWorker":28}],27:[function(t,e,r){"use strict";var i=t("../utils"),n=t("./GenericWorker");function s(t){n.call(this,"DataWorker");var e=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,t.then(function(t){e.dataIsReady=!0,e.data=t,e.max=t&&t.length||0,e.type=i.getTypeOf(t),e.isPaused||e._tickAndRepeat()},function(t){e.error(t)})}i.inherits(s,n),s.prototype.cleanUp=function(){n.prototype.cleanUp.call(this),this.data=null},s.prototype.resume=function(){return!!n.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,i.delay(this._tickAndRepeat,[],this)),!0)},s.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(i.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},s.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var t=null,e=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":t=this.data.substring(this.index,e);break;case"uint8array":t=this.data.subarray(this.index,e);break;case"array":case"nodebuffer":t=this.data.slice(this.index,e)}return this.index=e,this.push({data:t,meta:{percent:this.max?this.index/this.max*100:0}})},e.exports=s},{"../utils":32,"./GenericWorker":28}],28:[function(t,e,r){"use strict";function i(t){this.name=t||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}i.prototype={push:function(t){this.emit("data",t)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(t){this.emit("error",t)}return!0},error:function(t){return!this.isFinished&&(this.isPaused?this.generatedError=t:(this.isFinished=!0,this.emit("error",t),this.previous&&this.previous.error(t),this.cleanUp()),!0)},on:function(t,e){return this._listeners[t].push(e),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(t,e){if(this._listeners[t])for(var r=0;r<this._listeners[t].length;r++)this._listeners[t][r].call(this,e)},pipe:function(t){return t.registerPrevious(this)},registerPrevious:function(t){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=t.streamInfo,this.mergeStreamInfo(),this.previous=t;var e=this;return t.on("data",function(t){e.processChunk(t)}),t.on("end",function(){e.end()}),t.on("error",function(t){e.error(t)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var t=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),t=!0),this.previous&&this.previous.resume(),!t},flush:function(){},processChunk:function(t){this.push(t)},withStreamInfo:function(t,e){return this.extraStreamInfo[t]=e,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var t in this.extraStreamInfo)this.extraStreamInfo.hasOwnProperty(t)&&(this.streamInfo[t]=this.extraStreamInfo[t])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var t="Worker "+this.name;return this.previous?this.previous+" -> "+t:t}},e.exports=i},{}],29:[function(t,e,r){"use strict";var h=t("../utils"),n=t("./ConvertWorker"),s=t("./GenericWorker"),u=t("../base64"),i=t("../support"),a=t("../external"),o=null;if(i.nodestream)try{o=t("../nodejs/NodejsStreamOutputAdapter")}catch(t){}function l(t,o){return new a.Promise(function(e,r){var i=[],n=t._internalType,s=t._outputType,a=t._mimeType;t.on("data",function(t,e){i.push(t),o&&o(e)}).on("error",function(t){i=[],r(t)}).on("end",function(){try{var t=function(t,e,r){switch(t){case"blob":return h.newBlob(h.transformTo("arraybuffer",e),r);case"base64":return u.encode(e);default:return h.transformTo(t,e)}}(s,function(t,e){var r,i=0,n=null,s=0;for(r=0;r<e.length;r++)s+=e[r].length;switch(t){case"string":return e.join("");case"array":return Array.prototype.concat.apply([],e);case"uint8array":for(n=new Uint8Array(s),r=0;r<e.length;r++)n.set(e[r],i),i+=e[r].length;return n;case"nodebuffer":return Buffer.concat(e);default:throw new Error("concat : unsupported type '"+t+"'")}}(n,i),a);e(t)}catch(t){r(t)}i=[]}).resume()})}function f(t,e,r){var i=e;switch(e){case"blob":case"arraybuffer":i="uint8array";break;case"base64":i="string"}try{this._internalType=i,this._outputType=e,this._mimeType=r,h.checkSupport(i),this._worker=t.pipe(new n(i)),t.lock()}catch(t){this._worker=new s("error"),this._worker.error(t)}}f.prototype={accumulate:function(t){return l(this,t)},on:function(t,e){var r=this;return"data"===t?this._worker.on(t,function(t){e.call(r,t.data,t.meta)}):this._worker.on(t,function(){h.delay(e,arguments,r)}),this},resume:function(){return h.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(t){if(h.checkSupport("nodestream"),"nodebuffer"!==this._outputType)throw new Error(this._outputType+" is not supported by this method");return new o(this,{objectMode:"nodebuffer"!==this._outputType},t)}},e.exports=f},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(t,e,r){"use strict";if(r.base64=!0,r.array=!0,r.string=!0,r.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,r.nodebuffer="undefined"!=typeof Buffer,r.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)r.blob=!1;else{var i=new ArrayBuffer(0);try{r.blob=0===new Blob([i],{type:"application/zip"}).size}catch(t){try{var n=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);n.append(i),r.blob=0===n.getBlob("application/zip").size}catch(t){r.blob=!1}}}try{r.nodestream=!!t("readable-stream").Readable}catch(t){r.nodestream=!1}},{"readable-stream":16}],31:[function(t,e,s){"use strict";for(var o=t("./utils"),h=t("./support"),r=t("./nodejsUtils"),i=t("./stream/GenericWorker"),u=new Array(256),n=0;n<256;n++)u[n]=252<=n?6:248<=n?5:240<=n?4:224<=n?3:192<=n?2:1;u[254]=u[254]=1;function a(){i.call(this,"utf-8 decode"),this.leftOver=null}function l(){i.call(this,"utf-8 encode")}s.utf8encode=function(t){return h.nodebuffer?r.newBufferFrom(t,"utf-8"):function(t){var e,r,i,n,s,a=t.length,o=0;for(n=0;n<a;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),o+=r<128?1:r<2048?2:r<65536?3:4;for(e=h.uint8array?new Uint8Array(o):new Array(o),n=s=0;s<o;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),r<128?e[s++]=r:(r<2048?e[s++]=192|r>>>6:(r<65536?e[s++]=224|r>>>12:(e[s++]=240|r>>>18,e[s++]=128|r>>>12&63),e[s++]=128|r>>>6&63),e[s++]=128|63&r);return e}(t)},s.utf8decode=function(t){return h.nodebuffer?o.transformTo("nodebuffer",t).toString("utf-8"):function(t){var e,r,i,n,s=t.length,a=new Array(2*s);for(e=r=0;e<s;)if((i=t[e++])<128)a[r++]=i;else if(4<(n=u[i]))a[r++]=65533,e+=n-1;else{for(i&=2===n?31:3===n?15:7;1<n&&e<s;)i=i<<6|63&t[e++],n--;1<n?a[r++]=65533:i<65536?a[r++]=i:(i-=65536,a[r++]=55296|i>>10&1023,a[r++]=56320|1023&i)}return a.length!==r&&(a.subarray?a=a.subarray(0,r):a.length=r),o.applyFromCharCode(a)}(t=o.transformTo(h.uint8array?"uint8array":"array",t))},o.inherits(a,i),a.prototype.processChunk=function(t){var e=o.transformTo(h.uint8array?"uint8array":"array",t.data);if(this.leftOver&&this.leftOver.length){if(h.uint8array){var r=e;(e=new Uint8Array(r.length+this.leftOver.length)).set(this.leftOver,0),e.set(r,this.leftOver.length)}else e=this.leftOver.concat(e);this.leftOver=null}var i=function(t,e){var r;for((e=e||t.length)>t.length&&(e=t.length),r=e-1;0<=r&&128==(192&t[r]);)r--;return r<0?e:0===r?e:r+u[t[r]]>e?r:e}(e),n=e;i!==e.length&&(h.uint8array?(n=e.subarray(0,i),this.leftOver=e.subarray(i,e.length)):(n=e.slice(0,i),this.leftOver=e.slice(i,e.length))),this.push({data:s.utf8decode(n),meta:t.meta})},a.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},s.Utf8DecodeWorker=a,o.inherits(l,i),l.prototype.processChunk=function(t){this.push({data:s.utf8encode(t.data),meta:t.meta})},s.Utf8EncodeWorker=l},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(t,e,a){"use strict";var o=t("./support"),h=t("./base64"),r=t("./nodejsUtils"),i=t("set-immediate-shim"),u=t("./external");function n(t){return t}function l(t,e){for(var r=0;r<t.length;++r)e[r]=255&t.charCodeAt(r);return e}a.newBlob=function(e,r){a.checkSupport("blob");try{return new Blob([e],{type:r})}catch(t){try{var i=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return i.append(e),i.getBlob(r)}catch(t){throw new Error("Bug : can't construct the Blob.")}}};var s={stringifyByChunk:function(t,e,r){var i=[],n=0,s=t.length;if(s<=r)return String.fromCharCode.apply(null,t);for(;n<s;)"array"===e||"nodebuffer"===e?i.push(String.fromCharCode.apply(null,t.slice(n,Math.min(n+r,s)))):i.push(String.fromCharCode.apply(null,t.subarray(n,Math.min(n+r,s)))),n+=r;return i.join("")},stringifyByChar:function(t){for(var e="",r=0;r<t.length;r++)e+=String.fromCharCode(t[r]);return e},applyCanBeUsed:{uint8array:function(){try{return o.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(t){return!1}}(),nodebuffer:function(){try{return o.nodebuffer&&1===String.fromCharCode.apply(null,r.allocBuffer(1)).length}catch(t){return!1}}()}};function f(t){var e=65536,r=a.getTypeOf(t),i=!0;if("uint8array"===r?i=s.applyCanBeUsed.uint8array:"nodebuffer"===r&&(i=s.applyCanBeUsed.nodebuffer),i)for(;1<e;)try{return s.stringifyByChunk(t,r,e)}catch(t){e=Math.floor(e/2)}return s.stringifyByChar(t)}function d(t,e){for(var r=0;r<t.length;r++)e[r]=t[r];return e}a.applyFromCharCode=f;var c={};c.string={string:n,array:function(t){return l(t,new Array(t.length))},arraybuffer:function(t){return c.string.uint8array(t).buffer},uint8array:function(t){return l(t,new Uint8Array(t.length))},nodebuffer:function(t){return l(t,r.allocBuffer(t.length))}},c.array={string:f,array:n,arraybuffer:function(t){return new Uint8Array(t).buffer},uint8array:function(t){return new Uint8Array(t)},nodebuffer:function(t){return r.newBufferFrom(t)}},c.arraybuffer={string:function(t){return f(new Uint8Array(t))},array:function(t){return d(new Uint8Array(t),new Array(t.byteLength))},arraybuffer:n,uint8array:function(t){return new Uint8Array(t)},nodebuffer:function(t){return r.newBufferFrom(new Uint8Array(t))}},c.uint8array={string:f,array:function(t){return d(t,new Array(t.length))},arraybuffer:function(t){return t.buffer},uint8array:n,nodebuffer:function(t){return r.newBufferFrom(t)}},c.nodebuffer={string:f,array:function(t){return d(t,new Array(t.length))},arraybuffer:function(t){return c.nodebuffer.uint8array(t).buffer},uint8array:function(t){return d(t,new Uint8Array(t.length))},nodebuffer:n},a.transformTo=function(t,e){if(e=e||"",!t)return e;a.checkSupport(t);var r=a.getTypeOf(e);return c[r][t](e)},a.getTypeOf=function(t){return"string"==typeof t?"string":"[object Array]"===Object.prototype.toString.call(t)?"array":o.nodebuffer&&r.isBuffer(t)?"nodebuffer":o.uint8array&&t instanceof Uint8Array?"uint8array":o.arraybuffer&&t instanceof ArrayBuffer?"arraybuffer":void 0},a.checkSupport=function(t){if(!o[t.toLowerCase()])throw new Error(t+" is not supported by this platform")},a.MAX_VALUE_16BITS=65535,a.MAX_VALUE_32BITS=-1,a.pretty=function(t){var e,r,i="";for(r=0;r<(t||"").length;r++)i+="\\x"+((e=t.charCodeAt(r))<16?"0":"")+e.toString(16).toUpperCase();return i},a.delay=function(t,e,r){i(function(){t.apply(r||null,e||[])})},a.inherits=function(t,e){function r(){}r.prototype=e.prototype,t.prototype=new r},a.extend=function(){var t,e,r={};for(t=0;t<arguments.length;t++)for(e in arguments[t])arguments[t].hasOwnProperty(e)&&void 0===r[e]&&(r[e]=arguments[t][e]);return r},a.prepareContent=function(r,t,i,n,s){return u.Promise.resolve(t).then(function(i){return o.blob&&(i instanceof Blob||-1!==["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(i)))&&"undefined"!=typeof FileReader?new u.Promise(function(e,r){var t=new FileReader;t.onload=function(t){e(t.target.result)},t.onerror=function(t){r(t.target.error)},t.readAsArrayBuffer(i)}):i}).then(function(t){var e=a.getTypeOf(t);return e?("arraybuffer"===e?t=a.transformTo("uint8array",t):"string"===e&&(s?t=h.decode(t):i&&!0!==n&&(t=function(t){return l(t,o.uint8array?new Uint8Array(t.length):new Array(t.length))}(t))),t):u.Promise.reject(new Error("Can't read the data of '"+r+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,"set-immediate-shim":54}],33:[function(t,e,r){"use strict";var i=t("./reader/readerFor"),n=t("./utils"),s=t("./signature"),a=t("./zipEntry"),o=(t("./utf8"),t("./support"));function h(t){this.files=[],this.loadOptions=t}h.prototype={checkSignature:function(t){if(!this.reader.readAndCheckSignature(t)){this.reader.index-=4;var e=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+n.pretty(e)+", expected "+n.pretty(t)+")")}},isSignature:function(t,e){var r=this.reader.index;this.reader.setIndex(t);var i=this.reader.readString(4)===e;return this.reader.setIndex(r),i},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var t=this.reader.readData(this.zipCommentLength),e=o.uint8array?"uint8array":"array",r=n.transformTo(e,t);this.zipComment=this.loadOptions.decodeFileName(r)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var t,e,r,i=this.zip64EndOfCentralSize-44;0<i;)t=this.reader.readInt(2),e=this.reader.readInt(4),r=this.reader.readData(e),this.zip64ExtensibleData[t]={id:t,length:e,value:r}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var t,e;for(t=0;t<this.files.length;t++)e=this.files[t],this.reader.setIndex(e.localHeaderOffset),this.checkSignature(s.LOCAL_FILE_HEADER),e.readLocalPart(this.reader),e.handleUTF8(),e.processAttributes()},readCentralDir:function(){var t;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER);)(t=new a({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(t);if(this.centralDirRecords!==this.files.length&&0!==this.centralDirRecords&&0===this.files.length)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var t=this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);if(t<0)throw!this.isSignature(0,s.LOCAL_FILE_HEADER)?new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html"):new Error("Corrupted zip: can't find end of central directory");this.reader.setIndex(t);var e=t;if(this.checkSignature(s.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===n.MAX_VALUE_16BITS||this.diskWithCentralDirStart===n.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===n.MAX_VALUE_16BITS||this.centralDirRecords===n.MAX_VALUE_16BITS||this.centralDirSize===n.MAX_VALUE_32BITS||this.centralDirOffset===n.MAX_VALUE_32BITS){if(this.zip64=!0,(t=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(t),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,s.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var r=this.centralDirOffset+this.centralDirSize;this.zip64&&(r+=20,r+=12+this.zip64EndOfCentralSize);var i=e-r;if(0<i)this.isSignature(e,s.CENTRAL_FILE_HEADER)||(this.reader.zero=i);else if(i<0)throw new Error("Corrupted zip: missing "+Math.abs(i)+" bytes.")},prepareReader:function(t){this.reader=i(t)},load:function(t){this.prepareReader(t),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},e.exports=h},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utf8":31,"./utils":32,"./zipEntry":34}],34:[function(t,e,r){"use strict";var i=t("./reader/readerFor"),s=t("./utils"),n=t("./compressedObject"),a=t("./crc32"),o=t("./utf8"),h=t("./compressions"),u=t("./support");function l(t,e){this.options=t,this.loadOptions=e}l.prototype={isEncrypted:function(){return 1==(1&this.bitFlag)},useUTF8:function(){return 2048==(2048&this.bitFlag)},readLocalPart:function(t){var e,r;if(t.skip(22),this.fileNameLength=t.readInt(2),r=t.readInt(2),this.fileName=t.readData(this.fileNameLength),t.skip(r),-1===this.compressedSize||-1===this.uncompressedSize)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if(null===(e=function(t){for(var e in h)if(h.hasOwnProperty(e)&&h[e].magic===t)return h[e];return null}(this.compressionMethod)))throw new Error("Corrupted zip : compression "+s.pretty(this.compressionMethod)+" unknown (inner file : "+s.transformTo("string",this.fileName)+")");this.decompressed=new n(this.compressedSize,this.uncompressedSize,this.crc32,e,t.readData(this.compressedSize))},readCentralPart:function(t){this.versionMadeBy=t.readInt(2),t.skip(2),this.bitFlag=t.readInt(2),this.compressionMethod=t.readString(2),this.date=t.readDate(),this.crc32=t.readInt(4),this.compressedSize=t.readInt(4),this.uncompressedSize=t.readInt(4);var e=t.readInt(2);if(this.extraFieldsLength=t.readInt(2),this.fileCommentLength=t.readInt(2),this.diskNumberStart=t.readInt(2),this.internalFileAttributes=t.readInt(2),this.externalFileAttributes=t.readInt(4),this.localHeaderOffset=t.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");t.skip(e),this.readExtraFields(t),this.parseZIP64ExtraField(t),this.fileComment=t.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var t=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),0==t&&(this.dosPermissions=63&this.externalFileAttributes),3==t&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileNameStr.slice(-1)||(this.dir=!0)},parseZIP64ExtraField:function(t){if(this.extraFields[1]){var e=i(this.extraFields[1].value);this.uncompressedSize===s.MAX_VALUE_32BITS&&(this.uncompressedSize=e.readInt(8)),this.compressedSize===s.MAX_VALUE_32BITS&&(this.compressedSize=e.readInt(8)),this.localHeaderOffset===s.MAX_VALUE_32BITS&&(this.localHeaderOffset=e.readInt(8)),this.diskNumberStart===s.MAX_VALUE_32BITS&&(this.diskNumberStart=e.readInt(4))}},readExtraFields:function(t){var e,r,i,n=t.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});t.index+4<n;)e=t.readInt(2),r=t.readInt(2),i=t.readData(r),this.extraFields[e]={id:e,length:r,value:i};t.setIndex(n)},handleUTF8:function(){var t=u.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=o.utf8decode(this.fileName),this.fileCommentStr=o.utf8decode(this.fileComment);else{var e=this.findExtraFieldUnicodePath();if(null!==e)this.fileNameStr=e;else{var r=s.transformTo(t,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(r)}var i=this.findExtraFieldUnicodeComment();if(null!==i)this.fileCommentStr=i;else{var n=s.transformTo(t,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(n)}}},findExtraFieldUnicodePath:function(){var t=this.extraFields[28789];if(t){var e=i(t.value);return 1!==e.readInt(1)?null:a(this.fileName)!==e.readInt(4)?null:o.utf8decode(e.readData(t.length-5))}return null},findExtraFieldUnicodeComment:function(){var t=this.extraFields[25461];if(t){var e=i(t.value);return 1!==e.readInt(1)?null:a(this.fileComment)!==e.readInt(4)?null:o.utf8decode(e.readData(t.length-5))}return null}},e.exports=l},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(t,e,r){"use strict";function i(t,e,r){this.name=t,this.dir=r.dir,this.date=r.date,this.comment=r.comment,this.unixPermissions=r.unixPermissions,this.dosPermissions=r.dosPermissions,this._data=e,this._dataBinary=r.binary,this.options={compression:r.compression,compressionOptions:r.compressionOptions}}var s=t("./stream/StreamHelper"),n=t("./stream/DataWorker"),a=t("./utf8"),o=t("./compressedObject"),h=t("./stream/GenericWorker");i.prototype={internalStream:function(t){var e=null,r="string";try{if(!t)throw new Error("No output type specified.");var i="string"===(r=t.toLowerCase())||"text"===r;"binarystring"!==r&&"text"!==r||(r="string"),e=this._decompressWorker();var n=!this._dataBinary;n&&!i&&(e=e.pipe(new a.Utf8EncodeWorker)),!n&&i&&(e=e.pipe(new a.Utf8DecodeWorker))}catch(t){(e=new h("error")).error(t)}return new s(e,r,"")},async:function(t,e){return this.internalStream(t).accumulate(e)},nodeStream:function(t,e){return this.internalStream(t||"nodebuffer").toNodejsStream(e)},_compressWorker:function(t,e){if(this._data instanceof o&&this._data.compression.magic===t.magic)return this._data.getCompressedWorker();var r=this._decompressWorker();return this._dataBinary||(r=r.pipe(new a.Utf8EncodeWorker)),o.createWorkerFrom(r,t,e)},_decompressWorker:function(){return this._data instanceof o?this._data.getContentWorker():this._data instanceof h?this._data:new n(this._data)}};for(var u=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],l=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},f=0;f<u.length;f++)i.prototype[u[f]]=l;e.exports=i},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(t,l,e){(function(e){"use strict";var r,i,t=e.MutationObserver||e.WebKitMutationObserver;if(t){var n=0,s=new t(u),a=e.document.createTextNode("");s.observe(a,{characterData:!0}),r=function(){a.data=n=++n%2}}else if(e.setImmediate||void 0===e.MessageChannel)r="document"in e&&"onreadystatechange"in e.document.createElement("script")?function(){var t=e.document.createElement("script");t.onreadystatechange=function(){u(),t.onreadystatechange=null,t.parentNode.removeChild(t),t=null},e.document.documentElement.appendChild(t)}:function(){setTimeout(u,0)};else{var o=new e.MessageChannel;o.port1.onmessage=u,r=function(){o.port2.postMessage(0)}}var h=[];function u(){var t,e;i=!0;for(var r=h.length;r;){for(e=h,h=[],t=-1;++t<r;)e[t]();r=h.length}i=!1}l.exports=function(t){1!==h.push(t)||i||r()}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],37:[function(t,e,r){"use strict";var n=t("immediate");function u(){}var l={},s=["REJECTED"],a=["FULFILLED"],i=["PENDING"];function o(t){if("function"!=typeof t)throw new TypeError("resolver must be a function");this.state=i,this.queue=[],this.outcome=void 0,t!==u&&c(this,t)}function h(t,e,r){this.promise=t,"function"==typeof e&&(this.onFulfilled=e,this.callFulfilled=this.otherCallFulfilled),"function"==typeof r&&(this.onRejected=r,this.callRejected=this.otherCallRejected)}function f(e,r,i){n(function(){var t;try{t=r(i)}catch(t){return l.reject(e,t)}t===e?l.reject(e,new TypeError("Cannot resolve promise with itself")):l.resolve(e,t)})}function d(t){var e=t&&t.then;if(t&&("object"==typeof t||"function"==typeof t)&&"function"==typeof e)return function(){e.apply(t,arguments)}}function c(e,t){var r=!1;function i(t){r||(r=!0,l.reject(e,t))}function n(t){r||(r=!0,l.resolve(e,t))}var s=p(function(){t(n,i)});"error"===s.status&&i(s.value)}function p(t,e){var r={};try{r.value=t(e),r.status="success"}catch(t){r.status="error",r.value=t}return r}(e.exports=o).prototype.finally=function(e){if("function"!=typeof e)return this;var r=this.constructor;return this.then(function(t){return r.resolve(e()).then(function(){return t})},function(t){return r.resolve(e()).then(function(){throw t})})},o.prototype.catch=function(t){return this.then(null,t)},o.prototype.then=function(t,e){if("function"!=typeof t&&this.state===a||"function"!=typeof e&&this.state===s)return this;var r=new this.constructor(u);this.state!==i?f(r,this.state===a?t:e,this.outcome):this.queue.push(new h(r,t,e));return r},h.prototype.callFulfilled=function(t){l.resolve(this.promise,t)},h.prototype.otherCallFulfilled=function(t){f(this.promise,this.onFulfilled,t)},h.prototype.callRejected=function(t){l.reject(this.promise,t)},h.prototype.otherCallRejected=function(t){f(this.promise,this.onRejected,t)},l.resolve=function(t,e){var r=p(d,e);if("error"===r.status)return l.reject(t,r.value);var i=r.value;if(i)c(t,i);else{t.state=a,t.outcome=e;for(var n=-1,s=t.queue.length;++n<s;)t.queue[n].callFulfilled(e)}return t},l.reject=function(t,e){t.state=s,t.outcome=e;for(var r=-1,i=t.queue.length;++r<i;)t.queue[r].callRejected(e);return t},o.resolve=function(t){if(t instanceof this)return t;return l.resolve(new this(u),t)},o.reject=function(t){var e=new this(u);return l.reject(e,t)},o.all=function(t){var r=this;if("[object Array]"!==Object.prototype.toString.call(t))return this.reject(new TypeError("must be an array"));var i=t.length,n=!1;if(!i)return this.resolve([]);var s=new Array(i),a=0,e=-1,o=new this(u);for(;++e<i;)h(t[e],e);return o;function h(t,e){r.resolve(t).then(function(t){s[e]=t,++a!==i||n||(n=!0,l.resolve(o,s))},function(t){n||(n=!0,l.reject(o,t))})}},o.race=function(t){var e=this;if("[object Array]"!==Object.prototype.toString.call(t))return this.reject(new TypeError("must be an array"));var r=t.length,i=!1;if(!r)return this.resolve([]);var n=-1,s=new this(u);for(;++n<r;)a=t[n],e.resolve(a).then(function(t){i||(i=!0,l.resolve(s,t))},function(t){i||(i=!0,l.reject(s,t))});var a;return s}},{immediate:36}],38:[function(t,e,r){"use strict";var i={};(0,t("./lib/utils/common").assign)(i,t("./lib/deflate"),t("./lib/inflate"),t("./lib/zlib/constants")),e.exports=i},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(t,e,r){"use strict";var a=t("./zlib/deflate"),o=t("./utils/common"),h=t("./utils/strings"),n=t("./zlib/messages"),s=t("./zlib/zstream"),u=Object.prototype.toString,l=0,f=-1,d=0,c=8;function p(t){if(!(this instanceof p))return new p(t);this.options=o.assign({level:f,method:c,chunkSize:16384,windowBits:15,memLevel:8,strategy:d,to:""},t||{});var e=this.options;e.raw&&0<e.windowBits?e.windowBits=-e.windowBits:e.gzip&&0<e.windowBits&&e.windowBits<16&&(e.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new s,this.strm.avail_out=0;var r=a.deflateInit2(this.strm,e.level,e.method,e.windowBits,e.memLevel,e.strategy);if(r!==l)throw new Error(n[r]);if(e.header&&a.deflateSetHeader(this.strm,e.header),e.dictionary){var i;if(i="string"==typeof e.dictionary?h.string2buf(e.dictionary):"[object ArrayBuffer]"===u.call(e.dictionary)?new Uint8Array(e.dictionary):e.dictionary,(r=a.deflateSetDictionary(this.strm,i))!==l)throw new Error(n[r]);this._dict_set=!0}}function i(t,e){var r=new p(e);if(r.push(t,!0),r.err)throw r.msg||n[r.err];return r.result}p.prototype.push=function(t,e){var r,i,n=this.strm,s=this.options.chunkSize;if(this.ended)return!1;i=e===~~e?e:!0===e?4:0,"string"==typeof t?n.input=h.string2buf(t):"[object ArrayBuffer]"===u.call(t)?n.input=new Uint8Array(t):n.input=t,n.next_in=0,n.avail_in=n.input.length;do{if(0===n.avail_out&&(n.output=new o.Buf8(s),n.next_out=0,n.avail_out=s),1!==(r=a.deflate(n,i))&&r!==l)return this.onEnd(r),!(this.ended=!0);0!==n.avail_out&&(0!==n.avail_in||4!==i&&2!==i)||("string"===this.options.to?this.onData(h.buf2binstring(o.shrinkBuf(n.output,n.next_out))):this.onData(o.shrinkBuf(n.output,n.next_out)))}while((0<n.avail_in||0===n.avail_out)&&1!==r);return 4===i?(r=a.deflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===l):2!==i||(this.onEnd(l),!(n.avail_out=0))},p.prototype.onData=function(t){this.chunks.push(t)},p.prototype.onEnd=function(t){t===l&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg},r.Deflate=p,r.deflate=i,r.deflateRaw=function(t,e){return(e=e||{}).raw=!0,i(t,e)},r.gzip=function(t,e){return(e=e||{}).gzip=!0,i(t,e)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(t,e,r){"use strict";var d=t("./zlib/inflate"),c=t("./utils/common"),p=t("./utils/strings"),m=t("./zlib/constants"),i=t("./zlib/messages"),n=t("./zlib/zstream"),s=t("./zlib/gzheader"),_=Object.prototype.toString;function a(t){if(!(this instanceof a))return new a(t);this.options=c.assign({chunkSize:16384,windowBits:0,to:""},t||{});var e=this.options;e.raw&&0<=e.windowBits&&e.windowBits<16&&(e.windowBits=-e.windowBits,0===e.windowBits&&(e.windowBits=-15)),!(0<=e.windowBits&&e.windowBits<16)||t&&t.windowBits||(e.windowBits+=32),15<e.windowBits&&e.windowBits<48&&0==(15&e.windowBits)&&(e.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new n,this.strm.avail_out=0;var r=d.inflateInit2(this.strm,e.windowBits);if(r!==m.Z_OK)throw new Error(i[r]);this.header=new s,d.inflateGetHeader(this.strm,this.header)}function o(t,e){var r=new a(e);if(r.push(t,!0),r.err)throw r.msg||i[r.err];return r.result}a.prototype.push=function(t,e){var r,i,n,s,a,o,h=this.strm,u=this.options.chunkSize,l=this.options.dictionary,f=!1;if(this.ended)return!1;i=e===~~e?e:!0===e?m.Z_FINISH:m.Z_NO_FLUSH,"string"==typeof t?h.input=p.binstring2buf(t):"[object ArrayBuffer]"===_.call(t)?h.input=new Uint8Array(t):h.input=t,h.next_in=0,h.avail_in=h.input.length;do{if(0===h.avail_out&&(h.output=new c.Buf8(u),h.next_out=0,h.avail_out=u),(r=d.inflate(h,m.Z_NO_FLUSH))===m.Z_NEED_DICT&&l&&(o="string"==typeof l?p.string2buf(l):"[object ArrayBuffer]"===_.call(l)?new Uint8Array(l):l,r=d.inflateSetDictionary(this.strm,o)),r===m.Z_BUF_ERROR&&!0===f&&(r=m.Z_OK,f=!1),r!==m.Z_STREAM_END&&r!==m.Z_OK)return this.onEnd(r),!(this.ended=!0);h.next_out&&(0!==h.avail_out&&r!==m.Z_STREAM_END&&(0!==h.avail_in||i!==m.Z_FINISH&&i!==m.Z_SYNC_FLUSH)||("string"===this.options.to?(n=p.utf8border(h.output,h.next_out),s=h.next_out-n,a=p.buf2string(h.output,n),h.next_out=s,h.avail_out=u-s,s&&c.arraySet(h.output,h.output,n,s,0),this.onData(a)):this.onData(c.shrinkBuf(h.output,h.next_out)))),0===h.avail_in&&0===h.avail_out&&(f=!0)}while((0<h.avail_in||0===h.avail_out)&&r!==m.Z_STREAM_END);return r===m.Z_STREAM_END&&(i=m.Z_FINISH),i===m.Z_FINISH?(r=d.inflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===m.Z_OK):i!==m.Z_SYNC_FLUSH||(this.onEnd(m.Z_OK),!(h.avail_out=0))},a.prototype.onData=function(t){this.chunks.push(t)},a.prototype.onEnd=function(t){t===m.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=c.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg},r.Inflate=a,r.inflate=o,r.inflateRaw=function(t,e){return(e=e||{}).raw=!0,o(t,e)},r.ungzip=o},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(t,e,r){"use strict";var i="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;r.assign=function(t){for(var e=Array.prototype.slice.call(arguments,1);e.length;){var r=e.shift();if(r){if("object"!=typeof r)throw new TypeError(r+"must be non-object");for(var i in r)r.hasOwnProperty(i)&&(t[i]=r[i])}}return t},r.shrinkBuf=function(t,e){return t.length===e?t:t.subarray?t.subarray(0,e):(t.length=e,t)};var n={arraySet:function(t,e,r,i,n){if(e.subarray&&t.subarray)t.set(e.subarray(r,r+i),n);else for(var s=0;s<i;s++)t[n+s]=e[r+s]},flattenChunks:function(t){var e,r,i,n,s,a;for(e=i=0,r=t.length;e<r;e++)i+=t[e].length;for(a=new Uint8Array(i),e=n=0,r=t.length;e<r;e++)s=t[e],a.set(s,n),n+=s.length;return a}},s={arraySet:function(t,e,r,i,n){for(var s=0;s<i;s++)t[n+s]=e[r+s]},flattenChunks:function(t){return[].concat.apply([],t)}};r.setTyped=function(t){t?(r.Buf8=Uint8Array,r.Buf16=Uint16Array,r.Buf32=Int32Array,r.assign(r,n)):(r.Buf8=Array,r.Buf16=Array,r.Buf32=Array,r.assign(r,s))},r.setTyped(i)},{}],42:[function(t,e,r){"use strict";var h=t("./common"),n=!0,s=!0;try{String.fromCharCode.apply(null,[0])}catch(t){n=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(t){s=!1}for(var u=new h.Buf8(256),i=0;i<256;i++)u[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;function l(t,e){if(e<65537&&(t.subarray&&s||!t.subarray&&n))return String.fromCharCode.apply(null,h.shrinkBuf(t,e));for(var r="",i=0;i<e;i++)r+=String.fromCharCode(t[i]);return r}u[254]=u[254]=1,r.string2buf=function(t){var e,r,i,n,s,a=t.length,o=0;for(n=0;n<a;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),o+=r<128?1:r<2048?2:r<65536?3:4;for(e=new h.Buf8(o),n=s=0;s<o;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),r<128?e[s++]=r:(r<2048?e[s++]=192|r>>>6:(r<65536?e[s++]=224|r>>>12:(e[s++]=240|r>>>18,e[s++]=128|r>>>12&63),e[s++]=128|r>>>6&63),e[s++]=128|63&r);return e},r.buf2binstring=function(t){return l(t,t.length)},r.binstring2buf=function(t){for(var e=new h.Buf8(t.length),r=0,i=e.length;r<i;r++)e[r]=t.charCodeAt(r);return e},r.buf2string=function(t,e){var r,i,n,s,a=e||t.length,o=new Array(2*a);for(r=i=0;r<a;)if((n=t[r++])<128)o[i++]=n;else if(4<(s=u[n]))o[i++]=65533,r+=s-1;else{for(n&=2===s?31:3===s?15:7;1<s&&r<a;)n=n<<6|63&t[r++],s--;1<s?o[i++]=65533:n<65536?o[i++]=n:(n-=65536,o[i++]=55296|n>>10&1023,o[i++]=56320|1023&n)}return l(o,i)},r.utf8border=function(t,e){var r;for((e=e||t.length)>t.length&&(e=t.length),r=e-1;0<=r&&128==(192&t[r]);)r--;return r<0?e:0===r?e:r+u[t[r]]>e?r:e}},{"./common":41}],43:[function(t,e,r){"use strict";e.exports=function(t,e,r,i){for(var n=65535&t|0,s=t>>>16&65535|0,a=0;0!==r;){for(r-=a=2e3<r?2e3:r;s=s+(n=n+e[i++]|0)|0,--a;);n%=65521,s%=65521}return n|s<<16|0}},{}],44:[function(t,e,r){"use strict";e.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(t,e,r){"use strict";var o=function(){for(var t,e=[],r=0;r<256;r++){t=r;for(var i=0;i<8;i++)t=1&t?3988292384^t>>>1:t>>>1;e[r]=t}return e}();e.exports=function(t,e,r,i){var n=o,s=i+r;t^=-1;for(var a=i;a<s;a++)t=t>>>8^n[255&(t^e[a])];return-1^t}},{}],46:[function(t,e,r){"use strict";var h,d=t("../utils/common"),u=t("./trees"),c=t("./adler32"),p=t("./crc32"),i=t("./messages"),l=0,f=4,m=0,_=-2,g=-1,b=4,n=2,v=8,y=9,s=286,a=30,o=19,w=2*s+1,k=15,x=3,S=258,z=S+x+1,C=42,E=113,A=1,I=2,O=3,B=4;function R(t,e){return t.msg=i[e],e}function T(t){return(t<<1)-(4<t?9:0)}function D(t){for(var e=t.length;0<=--e;)t[e]=0}function F(t){var e=t.state,r=e.pending;r>t.avail_out&&(r=t.avail_out),0!==r&&(d.arraySet(t.output,e.pending_buf,e.pending_out,r,t.next_out),t.next_out+=r,e.pending_out+=r,t.total_out+=r,t.avail_out-=r,e.pending-=r,0===e.pending&&(e.pending_out=0))}function N(t,e){u._tr_flush_block(t,0<=t.block_start?t.block_start:-1,t.strstart-t.block_start,e),t.block_start=t.strstart,F(t.strm)}function U(t,e){t.pending_buf[t.pending++]=e}function P(t,e){t.pending_buf[t.pending++]=e>>>8&255,t.pending_buf[t.pending++]=255&e}function L(t,e){var r,i,n=t.max_chain_length,s=t.strstart,a=t.prev_length,o=t.nice_match,h=t.strstart>t.w_size-z?t.strstart-(t.w_size-z):0,u=t.window,l=t.w_mask,f=t.prev,d=t.strstart+S,c=u[s+a-1],p=u[s+a];t.prev_length>=t.good_match&&(n>>=2),o>t.lookahead&&(o=t.lookahead);do{if(u[(r=e)+a]===p&&u[r+a-1]===c&&u[r]===u[s]&&u[++r]===u[s+1]){s+=2,r++;do{}while(u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&s<d);if(i=S-(d-s),s=d-S,a<i){if(t.match_start=e,o<=(a=i))break;c=u[s+a-1],p=u[s+a]}}}while((e=f[e&l])>h&&0!=--n);return a<=t.lookahead?a:t.lookahead}function j(t){var e,r,i,n,s,a,o,h,u,l,f=t.w_size;do{if(n=t.window_size-t.lookahead-t.strstart,t.strstart>=f+(f-z)){for(d.arraySet(t.window,t.window,f,f,0),t.match_start-=f,t.strstart-=f,t.block_start-=f,e=r=t.hash_size;i=t.head[--e],t.head[e]=f<=i?i-f:0,--r;);for(e=r=f;i=t.prev[--e],t.prev[e]=f<=i?i-f:0,--r;);n+=f}if(0===t.strm.avail_in)break;if(a=t.strm,o=t.window,h=t.strstart+t.lookahead,u=n,l=void 0,l=a.avail_in,u<l&&(l=u),r=0===l?0:(a.avail_in-=l,d.arraySet(o,a.input,a.next_in,l,h),1===a.state.wrap?a.adler=c(a.adler,o,l,h):2===a.state.wrap&&(a.adler=p(a.adler,o,l,h)),a.next_in+=l,a.total_in+=l,l),t.lookahead+=r,t.lookahead+t.insert>=x)for(s=t.strstart-t.insert,t.ins_h=t.window[s],t.ins_h=(t.ins_h<<t.hash_shift^t.window[s+1])&t.hash_mask;t.insert&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[s+x-1])&t.hash_mask,t.prev[s&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=s,s++,t.insert--,!(t.lookahead+t.insert<x)););}while(t.lookahead<z&&0!==t.strm.avail_in)}function Z(t,e){for(var r,i;;){if(t.lookahead<z){if(j(t),t.lookahead<z&&e===l)return A;if(0===t.lookahead)break}if(r=0,t.lookahead>=x&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!==r&&t.strstart-r<=t.w_size-z&&(t.match_length=L(t,r)),t.match_length>=x)if(i=u._tr_tally(t,t.strstart-t.match_start,t.match_length-x),t.lookahead-=t.match_length,t.match_length<=t.max_lazy_match&&t.lookahead>=x){for(t.match_length--;t.strstart++,t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart,0!=--t.match_length;);t.strstart++}else t.strstart+=t.match_length,t.match_length=0,t.ins_h=t.window[t.strstart],t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+1])&t.hash_mask;else i=u._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++;if(i&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=t.strstart<x-1?t.strstart:x-1,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}function W(t,e){for(var r,i,n;;){if(t.lookahead<z){if(j(t),t.lookahead<z&&e===l)return A;if(0===t.lookahead)break}if(r=0,t.lookahead>=x&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),t.prev_length=t.match_length,t.prev_match=t.match_start,t.match_length=x-1,0!==r&&t.prev_length<t.max_lazy_match&&t.strstart-r<=t.w_size-z&&(t.match_length=L(t,r),t.match_length<=5&&(1===t.strategy||t.match_length===x&&4096<t.strstart-t.match_start)&&(t.match_length=x-1)),t.prev_length>=x&&t.match_length<=t.prev_length){for(n=t.strstart+t.lookahead-x,i=u._tr_tally(t,t.strstart-1-t.prev_match,t.prev_length-x),t.lookahead-=t.prev_length-1,t.prev_length-=2;++t.strstart<=n&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!=--t.prev_length;);if(t.match_available=0,t.match_length=x-1,t.strstart++,i&&(N(t,!1),0===t.strm.avail_out))return A}else if(t.match_available){if((i=u._tr_tally(t,0,t.window[t.strstart-1]))&&N(t,!1),t.strstart++,t.lookahead--,0===t.strm.avail_out)return A}else t.match_available=1,t.strstart++,t.lookahead--}return t.match_available&&(i=u._tr_tally(t,0,t.window[t.strstart-1]),t.match_available=0),t.insert=t.strstart<x-1?t.strstart:x-1,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}function M(t,e,r,i,n){this.good_length=t,this.max_lazy=e,this.nice_length=r,this.max_chain=i,this.func=n}function H(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=v,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new d.Buf16(2*w),this.dyn_dtree=new d.Buf16(2*(2*a+1)),this.bl_tree=new d.Buf16(2*(2*o+1)),D(this.dyn_ltree),D(this.dyn_dtree),D(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new d.Buf16(k+1),this.heap=new d.Buf16(2*s+1),D(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new d.Buf16(2*s+1),D(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function G(t){var e;return t&&t.state?(t.total_in=t.total_out=0,t.data_type=n,(e=t.state).pending=0,e.pending_out=0,e.wrap<0&&(e.wrap=-e.wrap),e.status=e.wrap?C:E,t.adler=2===e.wrap?0:1,e.last_flush=l,u._tr_init(e),m):R(t,_)}function K(t){var e=G(t);return e===m&&function(t){t.window_size=2*t.w_size,D(t.head),t.max_lazy_match=h[t.level].max_lazy,t.good_match=h[t.level].good_length,t.nice_match=h[t.level].nice_length,t.max_chain_length=h[t.level].max_chain,t.strstart=0,t.block_start=0,t.lookahead=0,t.insert=0,t.match_length=t.prev_length=x-1,t.match_available=0,t.ins_h=0}(t.state),e}function Y(t,e,r,i,n,s){if(!t)return _;var a=1;if(e===g&&(e=6),i<0?(a=0,i=-i):15<i&&(a=2,i-=16),n<1||y<n||r!==v||i<8||15<i||e<0||9<e||s<0||b<s)return R(t,_);8===i&&(i=9);var o=new H;return(t.state=o).strm=t,o.wrap=a,o.gzhead=null,o.w_bits=i,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=n+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+x-1)/x),o.window=new d.Buf8(2*o.w_size),o.head=new d.Buf16(o.hash_size),o.prev=new d.Buf16(o.w_size),o.lit_bufsize=1<<n+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new d.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=e,o.strategy=s,o.method=r,K(t)}h=[new M(0,0,0,0,function(t,e){var r=65535;for(r>t.pending_buf_size-5&&(r=t.pending_buf_size-5);;){if(t.lookahead<=1){if(j(t),0===t.lookahead&&e===l)return A;if(0===t.lookahead)break}t.strstart+=t.lookahead,t.lookahead=0;var i=t.block_start+r;if((0===t.strstart||t.strstart>=i)&&(t.lookahead=t.strstart-i,t.strstart=i,N(t,!1),0===t.strm.avail_out))return A;if(t.strstart-t.block_start>=t.w_size-z&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(N(t,!0),0===t.strm.avail_out?O:B):(t.strstart>t.block_start&&(N(t,!1),t.strm.avail_out),A)}),new M(4,4,8,4,Z),new M(4,5,16,8,Z),new M(4,6,32,32,Z),new M(4,4,16,16,W),new M(8,16,32,32,W),new M(8,16,128,128,W),new M(8,32,128,256,W),new M(32,128,258,1024,W),new M(32,258,258,4096,W)],r.deflateInit=function(t,e){return Y(t,e,v,15,8,0)},r.deflateInit2=Y,r.deflateReset=K,r.deflateResetKeep=G,r.deflateSetHeader=function(t,e){return t&&t.state?2!==t.state.wrap?_:(t.state.gzhead=e,m):_},r.deflate=function(t,e){var r,i,n,s;if(!t||!t.state||5<e||e<0)return t?R(t,_):_;if(i=t.state,!t.output||!t.input&&0!==t.avail_in||666===i.status&&e!==f)return R(t,0===t.avail_out?-5:_);if(i.strm=t,r=i.last_flush,i.last_flush=e,i.status===C)if(2===i.wrap)t.adler=0,U(i,31),U(i,139),U(i,8),i.gzhead?(U(i,(i.gzhead.text?1:0)+(i.gzhead.hcrc?2:0)+(i.gzhead.extra?4:0)+(i.gzhead.name?8:0)+(i.gzhead.comment?16:0)),U(i,255&i.gzhead.time),U(i,i.gzhead.time>>8&255),U(i,i.gzhead.time>>16&255),U(i,i.gzhead.time>>24&255),U(i,9===i.level?2:2<=i.strategy||i.level<2?4:0),U(i,255&i.gzhead.os),i.gzhead.extra&&i.gzhead.extra.length&&(U(i,255&i.gzhead.extra.length),U(i,i.gzhead.extra.length>>8&255)),i.gzhead.hcrc&&(t.adler=p(t.adler,i.pending_buf,i.pending,0)),i.gzindex=0,i.status=69):(U(i,0),U(i,0),U(i,0),U(i,0),U(i,0),U(i,9===i.level?2:2<=i.strategy||i.level<2?4:0),U(i,3),i.status=E);else{var a=v+(i.w_bits-8<<4)<<8;a|=(2<=i.strategy||i.level<2?0:i.level<6?1:6===i.level?2:3)<<6,0!==i.strstart&&(a|=32),a+=31-a%31,i.status=E,P(i,a),0!==i.strstart&&(P(i,t.adler>>>16),P(i,65535&t.adler)),t.adler=1}if(69===i.status)if(i.gzhead.extra){for(n=i.pending;i.gzindex<(65535&i.gzhead.extra.length)&&(i.pending!==i.pending_buf_size||(i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),F(t),n=i.pending,i.pending!==i.pending_buf_size));)U(i,255&i.gzhead.extra[i.gzindex]),i.gzindex++;i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),i.gzindex===i.gzhead.extra.length&&(i.gzindex=0,i.status=73)}else i.status=73;if(73===i.status)if(i.gzhead.name){n=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),F(t),n=i.pending,i.pending===i.pending_buf_size)){s=1;break}s=i.gzindex<i.gzhead.name.length?255&i.gzhead.name.charCodeAt(i.gzindex++):0,U(i,s)}while(0!==s);i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),0===s&&(i.gzindex=0,i.status=91)}else i.status=91;if(91===i.status)if(i.gzhead.comment){n=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),F(t),n=i.pending,i.pending===i.pending_buf_size)){s=1;break}s=i.gzindex<i.gzhead.comment.length?255&i.gzhead.comment.charCodeAt(i.gzindex++):0,U(i,s)}while(0!==s);i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),0===s&&(i.status=103)}else i.status=103;if(103===i.status&&(i.gzhead.hcrc?(i.pending+2>i.pending_buf_size&&F(t),i.pending+2<=i.pending_buf_size&&(U(i,255&t.adler),U(i,t.adler>>8&255),t.adler=0,i.status=E)):i.status=E),0!==i.pending){if(F(t),0===t.avail_out)return i.last_flush=-1,m}else if(0===t.avail_in&&T(e)<=T(r)&&e!==f)return R(t,-5);if(666===i.status&&0!==t.avail_in)return R(t,-5);if(0!==t.avail_in||0!==i.lookahead||e!==l&&666!==i.status){var o=2===i.strategy?function(t,e){for(var r;;){if(0===t.lookahead&&(j(t),0===t.lookahead)){if(e===l)return A;break}if(t.match_length=0,r=u._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++,r&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}(i,e):3===i.strategy?function(t,e){for(var r,i,n,s,a=t.window;;){if(t.lookahead<=S){if(j(t),t.lookahead<=S&&e===l)return A;if(0===t.lookahead)break}if(t.match_length=0,t.lookahead>=x&&0<t.strstart&&(i=a[n=t.strstart-1])===a[++n]&&i===a[++n]&&i===a[++n]){s=t.strstart+S;do{}while(i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&n<s);t.match_length=S-(s-n),t.match_length>t.lookahead&&(t.match_length=t.lookahead)}if(t.match_length>=x?(r=u._tr_tally(t,1,t.match_length-x),t.lookahead-=t.match_length,t.strstart+=t.match_length,t.match_length=0):(r=u._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++),r&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}(i,e):h[i.level].func(i,e);if(o!==O&&o!==B||(i.status=666),o===A||o===O)return 0===t.avail_out&&(i.last_flush=-1),m;if(o===I&&(1===e?u._tr_align(i):5!==e&&(u._tr_stored_block(i,0,0,!1),3===e&&(D(i.head),0===i.lookahead&&(i.strstart=0,i.block_start=0,i.insert=0))),F(t),0===t.avail_out))return i.last_flush=-1,m}return e!==f?m:i.wrap<=0?1:(2===i.wrap?(U(i,255&t.adler),U(i,t.adler>>8&255),U(i,t.adler>>16&255),U(i,t.adler>>24&255),U(i,255&t.total_in),U(i,t.total_in>>8&255),U(i,t.total_in>>16&255),U(i,t.total_in>>24&255)):(P(i,t.adler>>>16),P(i,65535&t.adler)),F(t),0<i.wrap&&(i.wrap=-i.wrap),0!==i.pending?m:1)},r.deflateEnd=function(t){var e;return t&&t.state?(e=t.state.status)!==C&&69!==e&&73!==e&&91!==e&&103!==e&&e!==E&&666!==e?R(t,_):(t.state=null,e===E?R(t,-3):m):_},r.deflateSetDictionary=function(t,e){var r,i,n,s,a,o,h,u,l=e.length;if(!t||!t.state)return _;if(2===(s=(r=t.state).wrap)||1===s&&r.status!==C||r.lookahead)return _;for(1===s&&(t.adler=c(t.adler,e,l,0)),r.wrap=0,l>=r.w_size&&(0===s&&(D(r.head),r.strstart=0,r.block_start=0,r.insert=0),u=new d.Buf8(r.w_size),d.arraySet(u,e,l-r.w_size,r.w_size,0),e=u,l=r.w_size),a=t.avail_in,o=t.next_in,h=t.input,t.avail_in=l,t.next_in=0,t.input=e,j(r);r.lookahead>=x;){for(i=r.strstart,n=r.lookahead-(x-1);r.ins_h=(r.ins_h<<r.hash_shift^r.window[i+x-1])&r.hash_mask,r.prev[i&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=i,i++,--n;);r.strstart=i,r.lookahead=x-1,j(r)}return r.strstart+=r.lookahead,r.block_start=r.strstart,r.insert=r.lookahead,r.lookahead=0,r.match_length=r.prev_length=x-1,r.match_available=0,t.next_in=o,t.input=h,t.avail_in=a,r.wrap=s,m},r.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(t,e,r){"use strict";e.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(t,e,r){"use strict";e.exports=function(t,e){var r,i,n,s,a,o,h,u,l,f,d,c,p,m,_,g,b,v,y,w,k,x,S,z,C;r=t.state,i=t.next_in,z=t.input,n=i+(t.avail_in-5),s=t.next_out,C=t.output,a=s-(e-t.avail_out),o=s+(t.avail_out-257),h=r.dmax,u=r.wsize,l=r.whave,f=r.wnext,d=r.window,c=r.hold,p=r.bits,m=r.lencode,_=r.distcode,g=(1<<r.lenbits)-1,b=(1<<r.distbits)-1;t:do{p<15&&(c+=z[i++]<<p,p+=8,c+=z[i++]<<p,p+=8),v=m[c&g];e:for(;;){if(c>>>=y=v>>>24,p-=y,0===(y=v>>>16&255))C[s++]=65535&v;else{if(!(16&y)){if(0==(64&y)){v=m[(65535&v)+(c&(1<<y)-1)];continue e}if(32&y){r.mode=12;break t}t.msg="invalid literal/length code",r.mode=30;break t}w=65535&v,(y&=15)&&(p<y&&(c+=z[i++]<<p,p+=8),w+=c&(1<<y)-1,c>>>=y,p-=y),p<15&&(c+=z[i++]<<p,p+=8,c+=z[i++]<<p,p+=8),v=_[c&b];r:for(;;){if(c>>>=y=v>>>24,p-=y,!(16&(y=v>>>16&255))){if(0==(64&y)){v=_[(65535&v)+(c&(1<<y)-1)];continue r}t.msg="invalid distance code",r.mode=30;break t}if(k=65535&v,p<(y&=15)&&(c+=z[i++]<<p,(p+=8)<y&&(c+=z[i++]<<p,p+=8)),h<(k+=c&(1<<y)-1)){t.msg="invalid distance too far back",r.mode=30;break t}if(c>>>=y,p-=y,(y=s-a)<k){if(l<(y=k-y)&&r.sane){t.msg="invalid distance too far back",r.mode=30;break t}if(S=d,(x=0)===f){if(x+=u-y,y<w){for(w-=y;C[s++]=d[x++],--y;);x=s-k,S=C}}else if(f<y){if(x+=u+f-y,(y-=f)<w){for(w-=y;C[s++]=d[x++],--y;);if(x=0,f<w){for(w-=y=f;C[s++]=d[x++],--y;);x=s-k,S=C}}}else if(x+=f-y,y<w){for(w-=y;C[s++]=d[x++],--y;);x=s-k,S=C}for(;2<w;)C[s++]=S[x++],C[s++]=S[x++],C[s++]=S[x++],w-=3;w&&(C[s++]=S[x++],1<w&&(C[s++]=S[x++]))}else{for(x=s-k;C[s++]=C[x++],C[s++]=C[x++],C[s++]=C[x++],2<(w-=3););w&&(C[s++]=C[x++],1<w&&(C[s++]=C[x++]))}break}}break}}while(i<n&&s<o);i-=w=p>>3,c&=(1<<(p-=w<<3))-1,t.next_in=i,t.next_out=s,t.avail_in=i<n?n-i+5:5-(i-n),t.avail_out=s<o?o-s+257:257-(s-o),r.hold=c,r.bits=p}},{}],49:[function(t,e,r){"use strict";var I=t("../utils/common"),O=t("./adler32"),B=t("./crc32"),R=t("./inffast"),T=t("./inftrees"),D=1,F=2,N=0,U=-2,P=1,i=852,n=592;function L(t){return(t>>>24&255)+(t>>>8&65280)+((65280&t)<<8)+((255&t)<<24)}function s(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new I.Buf16(320),this.work=new I.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function a(t){var e;return t&&t.state?(e=t.state,t.total_in=t.total_out=e.total=0,t.msg="",e.wrap&&(t.adler=1&e.wrap),e.mode=P,e.last=0,e.havedict=0,e.dmax=32768,e.head=null,e.hold=0,e.bits=0,e.lencode=e.lendyn=new I.Buf32(i),e.distcode=e.distdyn=new I.Buf32(n),e.sane=1,e.back=-1,N):U}function o(t){var e;return t&&t.state?((e=t.state).wsize=0,e.whave=0,e.wnext=0,a(t)):U}function h(t,e){var r,i;return t&&t.state?(i=t.state,e<0?(r=0,e=-e):(r=1+(e>>4),e<48&&(e&=15)),e&&(e<8||15<e)?U:(null!==i.window&&i.wbits!==e&&(i.window=null),i.wrap=r,i.wbits=e,o(t))):U}function u(t,e){var r,i;return t?(i=new s,(t.state=i).window=null,(r=h(t,e))!==N&&(t.state=null),r):U}var l,f,d=!0;function j(t){if(d){var e;for(l=new I.Buf32(512),f=new I.Buf32(32),e=0;e<144;)t.lens[e++]=8;for(;e<256;)t.lens[e++]=9;for(;e<280;)t.lens[e++]=7;for(;e<288;)t.lens[e++]=8;for(T(D,t.lens,0,288,l,0,t.work,{bits:9}),e=0;e<32;)t.lens[e++]=5;T(F,t.lens,0,32,f,0,t.work,{bits:5}),d=!1}t.lencode=l,t.lenbits=9,t.distcode=f,t.distbits=5}function Z(t,e,r,i){var n,s=t.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new I.Buf8(s.wsize)),i>=s.wsize?(I.arraySet(s.window,e,r-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):(i<(n=s.wsize-s.wnext)&&(n=i),I.arraySet(s.window,e,r-i,n,s.wnext),(i-=n)?(I.arraySet(s.window,e,r-i,i,0),s.wnext=i,s.whave=s.wsize):(s.wnext+=n,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=n))),0}r.inflateReset=o,r.inflateReset2=h,r.inflateResetKeep=a,r.inflateInit=function(t){return u(t,15)},r.inflateInit2=u,r.inflate=function(t,e){var r,i,n,s,a,o,h,u,l,f,d,c,p,m,_,g,b,v,y,w,k,x,S,z,C=0,E=new I.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!t||!t.state||!t.output||!t.input&&0!==t.avail_in)return U;12===(r=t.state).mode&&(r.mode=13),a=t.next_out,n=t.output,h=t.avail_out,s=t.next_in,i=t.input,o=t.avail_in,u=r.hold,l=r.bits,f=o,d=h,x=N;t:for(;;)switch(r.mode){case P:if(0===r.wrap){r.mode=13;break}for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(2&r.wrap&&35615===u){E[r.check=0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0),l=u=0,r.mode=2;break}if(r.flags=0,r.head&&(r.head.done=!1),!(1&r.wrap)||(((255&u)<<8)+(u>>8))%31){t.msg="incorrect header check",r.mode=30;break}if(8!=(15&u)){t.msg="unknown compression method",r.mode=30;break}if(l-=4,k=8+(15&(u>>>=4)),0===r.wbits)r.wbits=k;else if(k>r.wbits){t.msg="invalid window size",r.mode=30;break}r.dmax=1<<k,t.adler=r.check=1,r.mode=512&u?10:12,l=u=0;break;case 2:for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(r.flags=u,8!=(255&r.flags)){t.msg="unknown compression method",r.mode=30;break}if(57344&r.flags){t.msg="unknown header flags set",r.mode=30;break}r.head&&(r.head.text=u>>8&1),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=3;case 3:for(;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.head&&(r.head.time=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,E[2]=u>>>16&255,E[3]=u>>>24&255,r.check=B(r.check,E,4,0)),l=u=0,r.mode=4;case 4:for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.head&&(r.head.xflags=255&u,r.head.os=u>>8),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=5;case 5:if(1024&r.flags){for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.length=u,r.head&&(r.head.extra_len=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0}else r.head&&(r.head.extra=null);r.mode=6;case 6:if(1024&r.flags&&(o<(c=r.length)&&(c=o),c&&(r.head&&(k=r.head.extra_len-r.length,r.head.extra||(r.head.extra=new Array(r.head.extra_len)),I.arraySet(r.head.extra,i,s,c,k)),512&r.flags&&(r.check=B(r.check,i,c,s)),o-=c,s+=c,r.length-=c),r.length))break t;r.length=0,r.mode=7;case 7:if(2048&r.flags){if(0===o)break t;for(c=0;k=i[s+c++],r.head&&k&&r.length<65536&&(r.head.name+=String.fromCharCode(k)),k&&c<o;);if(512&r.flags&&(r.check=B(r.check,i,c,s)),o-=c,s+=c,k)break t}else r.head&&(r.head.name=null);r.length=0,r.mode=8;case 8:if(4096&r.flags){if(0===o)break t;for(c=0;k=i[s+c++],r.head&&k&&r.length<65536&&(r.head.comment+=String.fromCharCode(k)),k&&c<o;);if(512&r.flags&&(r.check=B(r.check,i,c,s)),o-=c,s+=c,k)break t}else r.head&&(r.head.comment=null);r.mode=9;case 9:if(512&r.flags){for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(u!==(65535&r.check)){t.msg="header crc mismatch",r.mode=30;break}l=u=0}r.head&&(r.head.hcrc=r.flags>>9&1,r.head.done=!0),t.adler=r.check=0,r.mode=12;break;case 10:for(;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}t.adler=r.check=L(u),l=u=0,r.mode=11;case 11:if(0===r.havedict)return t.next_out=a,t.avail_out=h,t.next_in=s,t.avail_in=o,r.hold=u,r.bits=l,2;t.adler=r.check=1,r.mode=12;case 12:if(5===e||6===e)break t;case 13:if(r.last){u>>>=7&l,l-=7&l,r.mode=27;break}for(;l<3;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}switch(r.last=1&u,l-=1,3&(u>>>=1)){case 0:r.mode=14;break;case 1:if(j(r),r.mode=20,6!==e)break;u>>>=2,l-=2;break t;case 2:r.mode=17;break;case 3:t.msg="invalid block type",r.mode=30}u>>>=2,l-=2;break;case 14:for(u>>>=7&l,l-=7&l;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if((65535&u)!=(u>>>16^65535)){t.msg="invalid stored block lengths",r.mode=30;break}if(r.length=65535&u,l=u=0,r.mode=15,6===e)break t;case 15:r.mode=16;case 16:if(c=r.length){if(o<c&&(c=o),h<c&&(c=h),0===c)break t;I.arraySet(n,i,s,c,a),o-=c,s+=c,h-=c,a+=c,r.length-=c;break}r.mode=12;break;case 17:for(;l<14;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(r.nlen=257+(31&u),u>>>=5,l-=5,r.ndist=1+(31&u),u>>>=5,l-=5,r.ncode=4+(15&u),u>>>=4,l-=4,286<r.nlen||30<r.ndist){t.msg="too many length or distance symbols",r.mode=30;break}r.have=0,r.mode=18;case 18:for(;r.have<r.ncode;){for(;l<3;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.lens[A[r.have++]]=7&u,u>>>=3,l-=3}for(;r.have<19;)r.lens[A[r.have++]]=0;if(r.lencode=r.lendyn,r.lenbits=7,S={bits:r.lenbits},x=T(0,r.lens,0,19,r.lencode,0,r.work,S),r.lenbits=S.bits,x){t.msg="invalid code lengths set",r.mode=30;break}r.have=0,r.mode=19;case 19:for(;r.have<r.nlen+r.ndist;){for(;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(b<16)u>>>=_,l-=_,r.lens[r.have++]=b;else{if(16===b){for(z=_+2;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(u>>>=_,l-=_,0===r.have){t.msg="invalid bit length repeat",r.mode=30;break}k=r.lens[r.have-1],c=3+(3&u),u>>>=2,l-=2}else if(17===b){for(z=_+3;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}l-=_,k=0,c=3+(7&(u>>>=_)),u>>>=3,l-=3}else{for(z=_+7;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}l-=_,k=0,c=11+(127&(u>>>=_)),u>>>=7,l-=7}if(r.have+c>r.nlen+r.ndist){t.msg="invalid bit length repeat",r.mode=30;break}for(;c--;)r.lens[r.have++]=k}}if(30===r.mode)break;if(0===r.lens[256]){t.msg="invalid code -- missing end-of-block",r.mode=30;break}if(r.lenbits=9,S={bits:r.lenbits},x=T(D,r.lens,0,r.nlen,r.lencode,0,r.work,S),r.lenbits=S.bits,x){t.msg="invalid literal/lengths set",r.mode=30;break}if(r.distbits=6,r.distcode=r.distdyn,S={bits:r.distbits},x=T(F,r.lens,r.nlen,r.ndist,r.distcode,0,r.work,S),r.distbits=S.bits,x){t.msg="invalid distances set",r.mode=30;break}if(r.mode=20,6===e)break t;case 20:r.mode=21;case 21:if(6<=o&&258<=h){t.next_out=a,t.avail_out=h,t.next_in=s,t.avail_in=o,r.hold=u,r.bits=l,R(t,d),a=t.next_out,n=t.output,h=t.avail_out,s=t.next_in,i=t.input,o=t.avail_in,u=r.hold,l=r.bits,12===r.mode&&(r.back=-1);break}for(r.back=0;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(g&&0==(240&g)){for(v=_,y=g,w=b;g=(C=r.lencode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,r.length=b,0===g){r.mode=26;break}if(32&g){r.back=-1,r.mode=12;break}if(64&g){t.msg="invalid literal/length code",r.mode=30;break}r.extra=15&g,r.mode=22;case 22:if(r.extra){for(z=r.extra;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.length+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}r.was=r.length,r.mode=23;case 23:for(;g=(C=r.distcode[u&(1<<r.distbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(0==(240&g)){for(v=_,y=g,w=b;g=(C=r.distcode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,64&g){t.msg="invalid distance code",r.mode=30;break}r.offset=b,r.extra=15&g,r.mode=24;case 24:if(r.extra){for(z=r.extra;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.offset+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}if(r.offset>r.dmax){t.msg="invalid distance too far back",r.mode=30;break}r.mode=25;case 25:if(0===h)break t;if(c=d-h,r.offset>c){if((c=r.offset-c)>r.whave&&r.sane){t.msg="invalid distance too far back",r.mode=30;break}p=c>r.wnext?(c-=r.wnext,r.wsize-c):r.wnext-c,c>r.length&&(c=r.length),m=r.window}else m=n,p=a-r.offset,c=r.length;for(h<c&&(c=h),h-=c,r.length-=c;n[a++]=m[p++],--c;);0===r.length&&(r.mode=21);break;case 26:if(0===h)break t;n[a++]=r.length,h--,r.mode=21;break;case 27:if(r.wrap){for(;l<32;){if(0===o)break t;o--,u|=i[s++]<<l,l+=8}if(d-=h,t.total_out+=d,r.total+=d,d&&(t.adler=r.check=r.flags?B(r.check,n,d,a-d):O(r.check,n,d,a-d)),d=h,(r.flags?u:L(u))!==r.check){t.msg="incorrect data check",r.mode=30;break}l=u=0}r.mode=28;case 28:if(r.wrap&&r.flags){for(;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(u!==(4294967295&r.total)){t.msg="incorrect length check",r.mode=30;break}l=u=0}r.mode=29;case 29:x=1;break t;case 30:x=-3;break t;case 31:return-4;case 32:default:return U}return t.next_out=a,t.avail_out=h,t.next_in=s,t.avail_in=o,r.hold=u,r.bits=l,(r.wsize||d!==t.avail_out&&r.mode<30&&(r.mode<27||4!==e))&&Z(t,t.output,t.next_out,d-t.avail_out)?(r.mode=31,-4):(f-=t.avail_in,d-=t.avail_out,t.total_in+=f,t.total_out+=d,r.total+=d,r.wrap&&d&&(t.adler=r.check=r.flags?B(r.check,n,d,t.next_out-d):O(r.check,n,d,t.next_out-d)),t.data_type=r.bits+(r.last?64:0)+(12===r.mode?128:0)+(20===r.mode||15===r.mode?256:0),(0==f&&0===d||4===e)&&x===N&&(x=-5),x)},r.inflateEnd=function(t){if(!t||!t.state)return U;var e=t.state;return e.window&&(e.window=null),t.state=null,N},r.inflateGetHeader=function(t,e){var r;return t&&t.state?0==(2&(r=t.state).wrap)?U:((r.head=e).done=!1,N):U},r.inflateSetDictionary=function(t,e){var r,i=e.length;return t&&t.state?0!==(r=t.state).wrap&&11!==r.mode?U:11===r.mode&&O(1,e,i,0)!==r.check?-3:Z(t,e,i,i)?(r.mode=31,-4):(r.havedict=1,N):U},r.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(t,e,r){"use strict";var D=t("../utils/common"),F=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],N=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],U=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],P=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];e.exports=function(t,e,r,i,n,s,a,o){var h,u,l,f,d,c,p,m,_,g=o.bits,b=0,v=0,y=0,w=0,k=0,x=0,S=0,z=0,C=0,E=0,A=null,I=0,O=new D.Buf16(16),B=new D.Buf16(16),R=null,T=0;for(b=0;b<=15;b++)O[b]=0;for(v=0;v<i;v++)O[e[r+v]]++;for(k=g,w=15;1<=w&&0===O[w];w--);if(w<k&&(k=w),0===w)return n[s++]=20971520,n[s++]=20971520,o.bits=1,0;for(y=1;y<w&&0===O[y];y++);for(k<y&&(k=y),b=z=1;b<=15;b++)if(z<<=1,(z-=O[b])<0)return-1;if(0<z&&(0===t||1!==w))return-1;for(B[1]=0,b=1;b<15;b++)B[b+1]=B[b]+O[b];for(v=0;v<i;v++)0!==e[r+v]&&(a[B[e[r+v]]++]=v);if(c=0===t?(A=R=a,19):1===t?(A=F,I-=257,R=N,T-=257,256):(A=U,R=P,-1),b=y,d=s,S=v=E=0,l=-1,f=(C=1<<(x=k))-1,1===t&&852<C||2===t&&592<C)return 1;for(;;){for(p=b-S,_=a[v]<c?(m=0,a[v]):a[v]>c?(m=R[T+a[v]],A[I+a[v]]):(m=96,0),h=1<<b-S,y=u=1<<x;n[d+(E>>S)+(u-=h)]=p<<24|m<<16|_|0,0!==u;);for(h=1<<b-1;E&h;)h>>=1;if(0!==h?(E&=h-1,E+=h):E=0,v++,0==--O[b]){if(b===w)break;b=e[r+a[v]]}if(k<b&&(E&f)!==l){for(0===S&&(S=k),d+=y,z=1<<(x=b-S);x+S<w&&!((z-=O[x+S])<=0);)x++,z<<=1;if(C+=1<<x,1===t&&852<C||2===t&&592<C)return 1;n[l=E&f]=k<<24|x<<16|d-s|0}}return 0!==E&&(n[d+E]=b-S<<24|64<<16|0),o.bits=k,0}},{"../utils/common":41}],51:[function(t,e,r){"use strict";e.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(t,e,r){"use strict";var n=t("../utils/common"),o=0,h=1;function i(t){for(var e=t.length;0<=--e;)t[e]=0}var s=0,a=29,u=256,l=u+1+a,f=30,d=19,_=2*l+1,g=15,c=16,p=7,m=256,b=16,v=17,y=18,w=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],k=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],x=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],S=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],z=new Array(2*(l+2));i(z);var C=new Array(2*f);i(C);var E=new Array(512);i(E);var A=new Array(256);i(A);var I=new Array(a);i(I);var O,B,R,T=new Array(f);function D(t,e,r,i,n){this.static_tree=t,this.extra_bits=e,this.extra_base=r,this.elems=i,this.max_length=n,this.has_stree=t&&t.length}function F(t,e){this.dyn_tree=t,this.max_code=0,this.stat_desc=e}function N(t){return t<256?E[t]:E[256+(t>>>7)]}function U(t,e){t.pending_buf[t.pending++]=255&e,t.pending_buf[t.pending++]=e>>>8&255}function P(t,e,r){t.bi_valid>c-r?(t.bi_buf|=e<<t.bi_valid&65535,U(t,t.bi_buf),t.bi_buf=e>>c-t.bi_valid,t.bi_valid+=r-c):(t.bi_buf|=e<<t.bi_valid&65535,t.bi_valid+=r)}function L(t,e,r){P(t,r[2*e],r[2*e+1])}function j(t,e){for(var r=0;r|=1&t,t>>>=1,r<<=1,0<--e;);return r>>>1}function Z(t,e,r){var i,n,s=new Array(g+1),a=0;for(i=1;i<=g;i++)s[i]=a=a+r[i-1]<<1;for(n=0;n<=e;n++){var o=t[2*n+1];0!==o&&(t[2*n]=j(s[o]++,o))}}function W(t){var e;for(e=0;e<l;e++)t.dyn_ltree[2*e]=0;for(e=0;e<f;e++)t.dyn_dtree[2*e]=0;for(e=0;e<d;e++)t.bl_tree[2*e]=0;t.dyn_ltree[2*m]=1,t.opt_len=t.static_len=0,t.last_lit=t.matches=0}function M(t){8<t.bi_valid?U(t,t.bi_buf):0<t.bi_valid&&(t.pending_buf[t.pending++]=t.bi_buf),t.bi_buf=0,t.bi_valid=0}function H(t,e,r,i){var n=2*e,s=2*r;return t[n]<t[s]||t[n]===t[s]&&i[e]<=i[r]}function G(t,e,r){for(var i=t.heap[r],n=r<<1;n<=t.heap_len&&(n<t.heap_len&&H(e,t.heap[n+1],t.heap[n],t.depth)&&n++,!H(e,i,t.heap[n],t.depth));)t.heap[r]=t.heap[n],r=n,n<<=1;t.heap[r]=i}function K(t,e,r){var i,n,s,a,o=0;if(0!==t.last_lit)for(;i=t.pending_buf[t.d_buf+2*o]<<8|t.pending_buf[t.d_buf+2*o+1],n=t.pending_buf[t.l_buf+o],o++,0===i?L(t,n,e):(L(t,(s=A[n])+u+1,e),0!==(a=w[s])&&P(t,n-=I[s],a),L(t,s=N(--i),r),0!==(a=k[s])&&P(t,i-=T[s],a)),o<t.last_lit;);L(t,m,e)}function Y(t,e){var r,i,n,s=e.dyn_tree,a=e.stat_desc.static_tree,o=e.stat_desc.has_stree,h=e.stat_desc.elems,u=-1;for(t.heap_len=0,t.heap_max=_,r=0;r<h;r++)0!==s[2*r]?(t.heap[++t.heap_len]=u=r,t.depth[r]=0):s[2*r+1]=0;for(;t.heap_len<2;)s[2*(n=t.heap[++t.heap_len]=u<2?++u:0)]=1,t.depth[n]=0,t.opt_len--,o&&(t.static_len-=a[2*n+1]);for(e.max_code=u,r=t.heap_len>>1;1<=r;r--)G(t,s,r);for(n=h;r=t.heap[1],t.heap[1]=t.heap[t.heap_len--],G(t,s,1),i=t.heap[1],t.heap[--t.heap_max]=r,t.heap[--t.heap_max]=i,s[2*n]=s[2*r]+s[2*i],t.depth[n]=(t.depth[r]>=t.depth[i]?t.depth[r]:t.depth[i])+1,s[2*r+1]=s[2*i+1]=n,t.heap[1]=n++,G(t,s,1),2<=t.heap_len;);t.heap[--t.heap_max]=t.heap[1],function(t,e){var r,i,n,s,a,o,h=e.dyn_tree,u=e.max_code,l=e.stat_desc.static_tree,f=e.stat_desc.has_stree,d=e.stat_desc.extra_bits,c=e.stat_desc.extra_base,p=e.stat_desc.max_length,m=0;for(s=0;s<=g;s++)t.bl_count[s]=0;for(h[2*t.heap[t.heap_max]+1]=0,r=t.heap_max+1;r<_;r++)p<(s=h[2*h[2*(i=t.heap[r])+1]+1]+1)&&(s=p,m++),h[2*i+1]=s,u<i||(t.bl_count[s]++,a=0,c<=i&&(a=d[i-c]),o=h[2*i],t.opt_len+=o*(s+a),f&&(t.static_len+=o*(l[2*i+1]+a)));if(0!==m){do{for(s=p-1;0===t.bl_count[s];)s--;t.bl_count[s]--,t.bl_count[s+1]+=2,t.bl_count[p]--,m-=2}while(0<m);for(s=p;0!==s;s--)for(i=t.bl_count[s];0!==i;)u<(n=t.heap[--r])||(h[2*n+1]!==s&&(t.opt_len+=(s-h[2*n+1])*h[2*n],h[2*n+1]=s),i--)}}(t,e),Z(s,u,t.bl_count)}function X(t,e,r){var i,n,s=-1,a=e[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),e[2*(r+1)+1]=65535,i=0;i<=r;i++)n=a,a=e[2*(i+1)+1],++o<h&&n===a||(o<u?t.bl_tree[2*n]+=o:0!==n?(n!==s&&t.bl_tree[2*n]++,t.bl_tree[2*b]++):o<=10?t.bl_tree[2*v]++:t.bl_tree[2*y]++,s=n,u=(o=0)===a?(h=138,3):n===a?(h=6,3):(h=7,4))}function V(t,e,r){var i,n,s=-1,a=e[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),i=0;i<=r;i++)if(n=a,a=e[2*(i+1)+1],!(++o<h&&n===a)){if(o<u)for(;L(t,n,t.bl_tree),0!=--o;);else 0!==n?(n!==s&&(L(t,n,t.bl_tree),o--),L(t,b,t.bl_tree),P(t,o-3,2)):o<=10?(L(t,v,t.bl_tree),P(t,o-3,3)):(L(t,y,t.bl_tree),P(t,o-11,7));s=n,u=(o=0)===a?(h=138,3):n===a?(h=6,3):(h=7,4)}}i(T);var q=!1;function J(t,e,r,i){P(t,(s<<1)+(i?1:0),3),function(t,e,r,i){M(t),i&&(U(t,r),U(t,~r)),n.arraySet(t.pending_buf,t.window,e,r,t.pending),t.pending+=r}(t,e,r,!0)}r._tr_init=function(t){q||(function(){var t,e,r,i,n,s=new Array(g+1);for(i=r=0;i<a-1;i++)for(I[i]=r,t=0;t<1<<w[i];t++)A[r++]=i;for(A[r-1]=i,i=n=0;i<16;i++)for(T[i]=n,t=0;t<1<<k[i];t++)E[n++]=i;for(n>>=7;i<f;i++)for(T[i]=n<<7,t=0;t<1<<k[i]-7;t++)E[256+n++]=i;for(e=0;e<=g;e++)s[e]=0;for(t=0;t<=143;)z[2*t+1]=8,t++,s[8]++;for(;t<=255;)z[2*t+1]=9,t++,s[9]++;for(;t<=279;)z[2*t+1]=7,t++,s[7]++;for(;t<=287;)z[2*t+1]=8,t++,s[8]++;for(Z(z,l+1,s),t=0;t<f;t++)C[2*t+1]=5,C[2*t]=j(t,5);O=new D(z,w,u+1,l,g),B=new D(C,k,0,f,g),R=new D(new Array(0),x,0,d,p)}(),q=!0),t.l_desc=new F(t.dyn_ltree,O),t.d_desc=new F(t.dyn_dtree,B),t.bl_desc=new F(t.bl_tree,R),t.bi_buf=0,t.bi_valid=0,W(t)},r._tr_stored_block=J,r._tr_flush_block=function(t,e,r,i){var n,s,a=0;0<t.level?(2===t.strm.data_type&&(t.strm.data_type=function(t){var e,r=4093624447;for(e=0;e<=31;e++,r>>>=1)if(1&r&&0!==t.dyn_ltree[2*e])return o;if(0!==t.dyn_ltree[18]||0!==t.dyn_ltree[20]||0!==t.dyn_ltree[26])return h;for(e=32;e<u;e++)if(0!==t.dyn_ltree[2*e])return h;return o}(t)),Y(t,t.l_desc),Y(t,t.d_desc),a=function(t){var e;for(X(t,t.dyn_ltree,t.l_desc.max_code),X(t,t.dyn_dtree,t.d_desc.max_code),Y(t,t.bl_desc),e=d-1;3<=e&&0===t.bl_tree[2*S[e]+1];e--);return t.opt_len+=3*(e+1)+5+5+4,e}(t),n=t.opt_len+3+7>>>3,(s=t.static_len+3+7>>>3)<=n&&(n=s)):n=s=r+5,r+4<=n&&-1!==e?J(t,e,r,i):4===t.strategy||s===n?(P(t,2+(i?1:0),3),K(t,z,C)):(P(t,4+(i?1:0),3),function(t,e,r,i){var n;for(P(t,e-257,5),P(t,r-1,5),P(t,i-4,4),n=0;n<i;n++)P(t,t.bl_tree[2*S[n]+1],3);V(t,t.dyn_ltree,e-1),V(t,t.dyn_dtree,r-1)}(t,t.l_desc.max_code+1,t.d_desc.max_code+1,a+1),K(t,t.dyn_ltree,t.dyn_dtree)),W(t),i&&M(t)},r._tr_tally=function(t,e,r){return t.pending_buf[t.d_buf+2*t.last_lit]=e>>>8&255,t.pending_buf[t.d_buf+2*t.last_lit+1]=255&e,t.pending_buf[t.l_buf+t.last_lit]=255&r,t.last_lit++,0===e?t.dyn_ltree[2*r]++:(t.matches++,e--,t.dyn_ltree[2*(A[r]+u+1)]++,t.dyn_dtree[2*N(e)]++),t.last_lit===t.lit_bufsize-1},r._tr_align=function(t){P(t,2,3),L(t,m,z),function(t){16===t.bi_valid?(U(t,t.bi_buf),t.bi_buf=0,t.bi_valid=0):8<=t.bi_valid&&(t.pending_buf[t.pending++]=255&t.bi_buf,t.bi_buf>>=8,t.bi_valid-=8)}(t)}},{"../utils/common":41}],53:[function(t,e,r){"use strict";e.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(t,e,r){"use strict";e.exports="function"==typeof setImmediate?setImmediate:function(){var t=[].slice.apply(arguments);t.splice(1,0,0),setTimeout.apply(null,t)}},{}]},{},[10])(10)});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5).Buffer, __webpack_require__(3), __webpack_require__(57).setImmediate))

/***/ }),
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var file_1 = __webpack_require__(19);
exports.Document = file_1.File;
__export(__webpack_require__(19));
__export(__webpack_require__(292));
__export(__webpack_require__(300));


/***/ }),
/* 117 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = __webpack_require__(20);
exports.EMPTY_OBJECT = Object.seal({});
class XmlComponent extends base_1.BaseXmlComponent {
    constructor(rootKey) {
        super(rootKey);
        this.root = new Array();
    }
    prepForXml(file) {
        const children = this.root
            .filter((c) => {
            if (c instanceof base_1.BaseXmlComponent) {
                return !c.IsDeleted;
            }
            return c !== undefined;
        })
            .map((comp) => {
            if (comp instanceof base_1.BaseXmlComponent) {
                return comp.prepForXml(file);
            }
            return comp;
        })
            .filter((comp) => comp !== undefined);
        const onlyAttrs = (c) => typeof c === "object" && c._attr;
        return {
            [this.rootKey]: children.length ? (children.length === 1 && onlyAttrs(children[0]) ? children[0] : children) : exports.EMPTY_OBJECT,
        };
    }
    addChildElement(child) {
        this.root.push(child);
        return this;
    }
    delete() {
        this.deleted = true;
    }
}
exports.XmlComponent = XmlComponent;
class IgnoreIfEmptyXmlComponent extends XmlComponent {
    prepForXml() {
        const result = super.prepForXml();
        if (result && (typeof result[this.rootKey] !== "object" || Object.keys(result[this.rootKey]).length)) {
            return result;
        }
    }
}
exports.IgnoreIfEmptyXmlComponent = IgnoreIfEmptyXmlComponent;


/***/ }),
/* 118 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const default_attributes_1 = __webpack_require__(50);
class Attributes extends default_attributes_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            val: "w:val",
            color: "w:color",
            fill: "w:fill",
            space: "w:space",
            sz: "w:sz",
            type: "w:type",
            rsidR: "w:rsidR",
            rsidRPr: "w:rsidRPr",
            rsidSect: "w:rsidSect",
            w: "w:w",
            h: "w:h",
            top: "w:top",
            right: "w:right",
            bottom: "w:bottom",
            left: "w:left",
            header: "w:header",
            footer: "w:footer",
            gutter: "w:gutter",
            linePitch: "w:linePitch",
            pos: "w:pos",
        };
    }
}
exports.Attributes = Attributes;


/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_js_1 = __webpack_require__(21);
const _1 = __webpack_require__(0);
function convertToXmlComponent(element) {
    switch (element.type) {
        case undefined:
        case "element":
            const xmlComponent = new ImportedXmlComponent(element.name, element.attributes);
            const childElments = element.elements || [];
            for (const childElm of childElments) {
                const child = convertToXmlComponent(childElm);
                if (child !== undefined) {
                    xmlComponent.push(child);
                }
            }
            return xmlComponent;
        case "text":
            return element.text;
        default:
            return undefined;
    }
}
exports.convertToXmlComponent = convertToXmlComponent;
class ImportedXmlComponentAttributes extends _1.XmlAttributeComponent {
}
class ImportedXmlComponent extends _1.XmlComponent {
    static fromXmlString(importedContent) {
        const xmlObj = xml_js_1.xml2js(importedContent, { compact: false });
        return convertToXmlComponent(xmlObj);
    }
    constructor(rootKey, _attr) {
        super(rootKey);
        if (_attr) {
            this.root.push(new ImportedXmlComponentAttributes(_attr));
        }
    }
    push(xmlComponent) {
        this.root.push(xmlComponent);
    }
}
exports.ImportedXmlComponent = ImportedXmlComponent;
class ImportedRootElementAttributes extends _1.XmlComponent {
    constructor(_attr) {
        super("");
        this._attr = _attr;
    }
    prepForXml() {
        return {
            _attr: this._attr,
        };
    }
}
exports.ImportedRootElementAttributes = ImportedRootElementAttributes;


/***/ }),
/* 120 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {;(function (sax) { // wrapper for non-node envs
  sax.parser = function (strict, opt) { return new SAXParser(strict, opt) }
  sax.SAXParser = SAXParser
  sax.SAXStream = SAXStream
  sax.createStream = createStream

  // When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
  // When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
  // since that's the earliest that a buffer overrun could occur.  This way, checks are
  // as rare as required, but as often as necessary to ensure never crossing this bound.
  // Furthermore, buffers are only tested at most once per write(), so passing a very
  // large string into write() might have undesirable effects, but this is manageable by
  // the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
  // edge case, result in creating at most one complete copy of the string passed in.
  // Set to Infinity to have unlimited buffers.
  sax.MAX_BUFFER_LENGTH = 64 * 1024

  var buffers = [
    'comment', 'sgmlDecl', 'textNode', 'tagName', 'doctype',
    'procInstName', 'procInstBody', 'entity', 'attribName',
    'attribValue', 'cdata', 'script'
  ]

  sax.EVENTS = [
    'text',
    'processinginstruction',
    'sgmldeclaration',
    'doctype',
    'comment',
    'opentagstart',
    'attribute',
    'opentag',
    'closetag',
    'opencdata',
    'cdata',
    'closecdata',
    'error',
    'end',
    'ready',
    'script',
    'opennamespace',
    'closenamespace'
  ]

  function SAXParser (strict, opt) {
    if (!(this instanceof SAXParser)) {
      return new SAXParser(strict, opt)
    }

    var parser = this
    clearBuffers(parser)
    parser.q = parser.c = ''
    parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH
    parser.opt = opt || {}
    parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags
    parser.looseCase = parser.opt.lowercase ? 'toLowerCase' : 'toUpperCase'
    parser.tags = []
    parser.closed = parser.closedRoot = parser.sawRoot = false
    parser.tag = parser.error = null
    parser.strict = !!strict
    parser.noscript = !!(strict || parser.opt.noscript)
    parser.state = S.BEGIN
    parser.strictEntities = parser.opt.strictEntities
    parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES)
    parser.attribList = []

    // namespaces form a prototype chain.
    // it always points at the current tag,
    // which protos to its parent tag.
    if (parser.opt.xmlns) {
      parser.ns = Object.create(rootNS)
    }

    // mostly just for error reporting
    parser.trackPosition = parser.opt.position !== false
    if (parser.trackPosition) {
      parser.position = parser.line = parser.column = 0
    }
    emit(parser, 'onready')
  }

  if (!Object.create) {
    Object.create = function (o) {
      function F () {}
      F.prototype = o
      var newf = new F()
      return newf
    }
  }

  if (!Object.keys) {
    Object.keys = function (o) {
      var a = []
      for (var i in o) if (o.hasOwnProperty(i)) a.push(i)
      return a
    }
  }

  function checkBufferLength (parser) {
    var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10)
    var maxActual = 0
    for (var i = 0, l = buffers.length; i < l; i++) {
      var len = parser[buffers[i]].length
      if (len > maxAllowed) {
        // Text/cdata nodes can get big, and since they're buffered,
        // we can get here under normal conditions.
        // Avoid issues by emitting the text node now,
        // so at least it won't get any bigger.
        switch (buffers[i]) {
          case 'textNode':
            closeText(parser)
            break

          case 'cdata':
            emitNode(parser, 'oncdata', parser.cdata)
            parser.cdata = ''
            break

          case 'script':
            emitNode(parser, 'onscript', parser.script)
            parser.script = ''
            break

          default:
            error(parser, 'Max buffer length exceeded: ' + buffers[i])
        }
      }
      maxActual = Math.max(maxActual, len)
    }
    // schedule the next check for the earliest possible buffer overrun.
    var m = sax.MAX_BUFFER_LENGTH - maxActual
    parser.bufferCheckPosition = m + parser.position
  }

  function clearBuffers (parser) {
    for (var i = 0, l = buffers.length; i < l; i++) {
      parser[buffers[i]] = ''
    }
  }

  function flushBuffers (parser) {
    closeText(parser)
    if (parser.cdata !== '') {
      emitNode(parser, 'oncdata', parser.cdata)
      parser.cdata = ''
    }
    if (parser.script !== '') {
      emitNode(parser, 'onscript', parser.script)
      parser.script = ''
    }
  }

  SAXParser.prototype = {
    end: function () { end(this) },
    write: write,
    resume: function () { this.error = null; return this },
    close: function () { return this.write(null) },
    flush: function () { flushBuffers(this) }
  }

  var Stream
  try {
    Stream = __webpack_require__(53).Stream
  } catch (ex) {
    Stream = function () {}
  }

  var streamWraps = sax.EVENTS.filter(function (ev) {
    return ev !== 'error' && ev !== 'end'
  })

  function createStream (strict, opt) {
    return new SAXStream(strict, opt)
  }

  function SAXStream (strict, opt) {
    if (!(this instanceof SAXStream)) {
      return new SAXStream(strict, opt)
    }

    Stream.apply(this)

    this._parser = new SAXParser(strict, opt)
    this.writable = true
    this.readable = true

    var me = this

    this._parser.onend = function () {
      me.emit('end')
    }

    this._parser.onerror = function (er) {
      me.emit('error', er)

      // if didn't throw, then means error was handled.
      // go ahead and clear error, so we can write again.
      me._parser.error = null
    }

    this._decoder = null

    streamWraps.forEach(function (ev) {
      Object.defineProperty(me, 'on' + ev, {
        get: function () {
          return me._parser['on' + ev]
        },
        set: function (h) {
          if (!h) {
            me.removeAllListeners(ev)
            me._parser['on' + ev] = h
            return h
          }
          me.on(ev, h)
        },
        enumerable: true,
        configurable: false
      })
    })
  }

  SAXStream.prototype = Object.create(Stream.prototype, {
    constructor: {
      value: SAXStream
    }
  })

  SAXStream.prototype.write = function (data) {
    if (typeof Buffer === 'function' &&
      typeof Buffer.isBuffer === 'function' &&
      Buffer.isBuffer(data)) {
      if (!this._decoder) {
        var SD = __webpack_require__(25).StringDecoder
        this._decoder = new SD('utf8')
      }
      data = this._decoder.write(data)
    }

    this._parser.write(data.toString())
    this.emit('data', data)
    return true
  }

  SAXStream.prototype.end = function (chunk) {
    if (chunk && chunk.length) {
      this.write(chunk)
    }
    this._parser.end()
    return true
  }

  SAXStream.prototype.on = function (ev, handler) {
    var me = this
    if (!me._parser['on' + ev] && streamWraps.indexOf(ev) !== -1) {
      me._parser['on' + ev] = function () {
        var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments)
        args.splice(0, 0, ev)
        me.emit.apply(me, args)
      }
    }

    return Stream.prototype.on.call(me, ev, handler)
  }

  // this really needs to be replaced with character classes.
  // XML allows all manner of ridiculous numbers and digits.
  var CDATA = '[CDATA['
  var DOCTYPE = 'DOCTYPE'
  var XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace'
  var XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'
  var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE }

  // http://www.w3.org/TR/REC-xml/#NT-NameStartChar
  // This implementation works on strings, a single character at a time
  // as such, it cannot ever support astral-plane characters (10000-EFFFF)
  // without a significant breaking change to either this  parser, or the
  // JavaScript language.  Implementation of an emoji-capable xml parser
  // is left as an exercise for the reader.
  var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/

  var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/

  var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/
  var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/

  function isWhitespace (c) {
    return c === ' ' || c === '\n' || c === '\r' || c === '\t'
  }

  function isQuote (c) {
    return c === '"' || c === '\''
  }

  function isAttribEnd (c) {
    return c === '>' || isWhitespace(c)
  }

  function isMatch (regex, c) {
    return regex.test(c)
  }

  function notMatch (regex, c) {
    return !isMatch(regex, c)
  }

  var S = 0
  sax.STATE = {
    BEGIN: S++, // leading byte order mark or whitespace
    BEGIN_WHITESPACE: S++, // leading whitespace
    TEXT: S++, // general stuff
    TEXT_ENTITY: S++, // &amp and such.
    OPEN_WAKA: S++, // <
    SGML_DECL: S++, // <!BLARG
    SGML_DECL_QUOTED: S++, // <!BLARG foo "bar
    DOCTYPE: S++, // <!DOCTYPE
    DOCTYPE_QUOTED: S++, // <!DOCTYPE "//blah
    DOCTYPE_DTD: S++, // <!DOCTYPE "//blah" [ ...
    DOCTYPE_DTD_QUOTED: S++, // <!DOCTYPE "//blah" [ "foo
    COMMENT_STARTING: S++, // <!-
    COMMENT: S++, // <!--
    COMMENT_ENDING: S++, // <!-- blah -
    COMMENT_ENDED: S++, // <!-- blah --
    CDATA: S++, // <![CDATA[ something
    CDATA_ENDING: S++, // ]
    CDATA_ENDING_2: S++, // ]]
    PROC_INST: S++, // <?hi
    PROC_INST_BODY: S++, // <?hi there
    PROC_INST_ENDING: S++, // <?hi "there" ?
    OPEN_TAG: S++, // <strong
    OPEN_TAG_SLASH: S++, // <strong /
    ATTRIB: S++, // <a
    ATTRIB_NAME: S++, // <a foo
    ATTRIB_NAME_SAW_WHITE: S++, // <a foo _
    ATTRIB_VALUE: S++, // <a foo=
    ATTRIB_VALUE_QUOTED: S++, // <a foo="bar
    ATTRIB_VALUE_CLOSED: S++, // <a foo="bar"
    ATTRIB_VALUE_UNQUOTED: S++, // <a foo=bar
    ATTRIB_VALUE_ENTITY_Q: S++, // <foo bar="&quot;"
    ATTRIB_VALUE_ENTITY_U: S++, // <foo bar=&quot
    CLOSE_TAG: S++, // </a
    CLOSE_TAG_SAW_WHITE: S++, // </a   >
    SCRIPT: S++, // <script> ...
    SCRIPT_ENDING: S++ // <script> ... <
  }

  sax.XML_ENTITIES = {
    'amp': '&',
    'gt': '>',
    'lt': '<',
    'quot': '"',
    'apos': "'"
  }

  sax.ENTITIES = {
    'amp': '&',
    'gt': '>',
    'lt': '<',
    'quot': '"',
    'apos': "'",
    'AElig': 198,
    'Aacute': 193,
    'Acirc': 194,
    'Agrave': 192,
    'Aring': 197,
    'Atilde': 195,
    'Auml': 196,
    'Ccedil': 199,
    'ETH': 208,
    'Eacute': 201,
    'Ecirc': 202,
    'Egrave': 200,
    'Euml': 203,
    'Iacute': 205,
    'Icirc': 206,
    'Igrave': 204,
    'Iuml': 207,
    'Ntilde': 209,
    'Oacute': 211,
    'Ocirc': 212,
    'Ograve': 210,
    'Oslash': 216,
    'Otilde': 213,
    'Ouml': 214,
    'THORN': 222,
    'Uacute': 218,
    'Ucirc': 219,
    'Ugrave': 217,
    'Uuml': 220,
    'Yacute': 221,
    'aacute': 225,
    'acirc': 226,
    'aelig': 230,
    'agrave': 224,
    'aring': 229,
    'atilde': 227,
    'auml': 228,
    'ccedil': 231,
    'eacute': 233,
    'ecirc': 234,
    'egrave': 232,
    'eth': 240,
    'euml': 235,
    'iacute': 237,
    'icirc': 238,
    'igrave': 236,
    'iuml': 239,
    'ntilde': 241,
    'oacute': 243,
    'ocirc': 244,
    'ograve': 242,
    'oslash': 248,
    'otilde': 245,
    'ouml': 246,
    'szlig': 223,
    'thorn': 254,
    'uacute': 250,
    'ucirc': 251,
    'ugrave': 249,
    'uuml': 252,
    'yacute': 253,
    'yuml': 255,
    'copy': 169,
    'reg': 174,
    'nbsp': 160,
    'iexcl': 161,
    'cent': 162,
    'pound': 163,
    'curren': 164,
    'yen': 165,
    'brvbar': 166,
    'sect': 167,
    'uml': 168,
    'ordf': 170,
    'laquo': 171,
    'not': 172,
    'shy': 173,
    'macr': 175,
    'deg': 176,
    'plusmn': 177,
    'sup1': 185,
    'sup2': 178,
    'sup3': 179,
    'acute': 180,
    'micro': 181,
    'para': 182,
    'middot': 183,
    'cedil': 184,
    'ordm': 186,
    'raquo': 187,
    'frac14': 188,
    'frac12': 189,
    'frac34': 190,
    'iquest': 191,
    'times': 215,
    'divide': 247,
    'OElig': 338,
    'oelig': 339,
    'Scaron': 352,
    'scaron': 353,
    'Yuml': 376,
    'fnof': 402,
    'circ': 710,
    'tilde': 732,
    'Alpha': 913,
    'Beta': 914,
    'Gamma': 915,
    'Delta': 916,
    'Epsilon': 917,
    'Zeta': 918,
    'Eta': 919,
    'Theta': 920,
    'Iota': 921,
    'Kappa': 922,
    'Lambda': 923,
    'Mu': 924,
    'Nu': 925,
    'Xi': 926,
    'Omicron': 927,
    'Pi': 928,
    'Rho': 929,
    'Sigma': 931,
    'Tau': 932,
    'Upsilon': 933,
    'Phi': 934,
    'Chi': 935,
    'Psi': 936,
    'Omega': 937,
    'alpha': 945,
    'beta': 946,
    'gamma': 947,
    'delta': 948,
    'epsilon': 949,
    'zeta': 950,
    'eta': 951,
    'theta': 952,
    'iota': 953,
    'kappa': 954,
    'lambda': 955,
    'mu': 956,
    'nu': 957,
    'xi': 958,
    'omicron': 959,
    'pi': 960,
    'rho': 961,
    'sigmaf': 962,
    'sigma': 963,
    'tau': 964,
    'upsilon': 965,
    'phi': 966,
    'chi': 967,
    'psi': 968,
    'omega': 969,
    'thetasym': 977,
    'upsih': 978,
    'piv': 982,
    'ensp': 8194,
    'emsp': 8195,
    'thinsp': 8201,
    'zwnj': 8204,
    'zwj': 8205,
    'lrm': 8206,
    'rlm': 8207,
    'ndash': 8211,
    'mdash': 8212,
    'lsquo': 8216,
    'rsquo': 8217,
    'sbquo': 8218,
    'ldquo': 8220,
    'rdquo': 8221,
    'bdquo': 8222,
    'dagger': 8224,
    'Dagger': 8225,
    'bull': 8226,
    'hellip': 8230,
    'permil': 8240,
    'prime': 8242,
    'Prime': 8243,
    'lsaquo': 8249,
    'rsaquo': 8250,
    'oline': 8254,
    'frasl': 8260,
    'euro': 8364,
    'image': 8465,
    'weierp': 8472,
    'real': 8476,
    'trade': 8482,
    'alefsym': 8501,
    'larr': 8592,
    'uarr': 8593,
    'rarr': 8594,
    'darr': 8595,
    'harr': 8596,
    'crarr': 8629,
    'lArr': 8656,
    'uArr': 8657,
    'rArr': 8658,
    'dArr': 8659,
    'hArr': 8660,
    'forall': 8704,
    'part': 8706,
    'exist': 8707,
    'empty': 8709,
    'nabla': 8711,
    'isin': 8712,
    'notin': 8713,
    'ni': 8715,
    'prod': 8719,
    'sum': 8721,
    'minus': 8722,
    'lowast': 8727,
    'radic': 8730,
    'prop': 8733,
    'infin': 8734,
    'ang': 8736,
    'and': 8743,
    'or': 8744,
    'cap': 8745,
    'cup': 8746,
    'int': 8747,
    'there4': 8756,
    'sim': 8764,
    'cong': 8773,
    'asymp': 8776,
    'ne': 8800,
    'equiv': 8801,
    'le': 8804,
    'ge': 8805,
    'sub': 8834,
    'sup': 8835,
    'nsub': 8836,
    'sube': 8838,
    'supe': 8839,
    'oplus': 8853,
    'otimes': 8855,
    'perp': 8869,
    'sdot': 8901,
    'lceil': 8968,
    'rceil': 8969,
    'lfloor': 8970,
    'rfloor': 8971,
    'lang': 9001,
    'rang': 9002,
    'loz': 9674,
    'spades': 9824,
    'clubs': 9827,
    'hearts': 9829,
    'diams': 9830
  }

  Object.keys(sax.ENTITIES).forEach(function (key) {
    var e = sax.ENTITIES[key]
    var s = typeof e === 'number' ? String.fromCharCode(e) : e
    sax.ENTITIES[key] = s
  })

  for (var s in sax.STATE) {
    sax.STATE[sax.STATE[s]] = s
  }

  // shorthand
  S = sax.STATE

  function emit (parser, event, data) {
    parser[event] && parser[event](data)
  }

  function emitNode (parser, nodeType, data) {
    if (parser.textNode) closeText(parser)
    emit(parser, nodeType, data)
  }

  function closeText (parser) {
    parser.textNode = textopts(parser.opt, parser.textNode)
    if (parser.textNode) emit(parser, 'ontext', parser.textNode)
    parser.textNode = ''
  }

  function textopts (opt, text) {
    if (opt.trim) text = text.trim()
    if (opt.normalize) text = text.replace(/\s+/g, ' ')
    return text
  }

  function error (parser, er) {
    closeText(parser)
    if (parser.trackPosition) {
      er += '\nLine: ' + parser.line +
        '\nColumn: ' + parser.column +
        '\nChar: ' + parser.c
    }
    er = new Error(er)
    parser.error = er
    emit(parser, 'onerror', er)
    return parser
  }

  function end (parser) {
    if (parser.sawRoot && !parser.closedRoot) strictFail(parser, 'Unclosed root tag')
    if ((parser.state !== S.BEGIN) &&
      (parser.state !== S.BEGIN_WHITESPACE) &&
      (parser.state !== S.TEXT)) {
      error(parser, 'Unexpected end')
    }
    closeText(parser)
    parser.c = ''
    parser.closed = true
    emit(parser, 'onend')
    SAXParser.call(parser, parser.strict, parser.opt)
    return parser
  }

  function strictFail (parser, message) {
    if (typeof parser !== 'object' || !(parser instanceof SAXParser)) {
      throw new Error('bad call to strictFail')
    }
    if (parser.strict) {
      error(parser, message)
    }
  }

  function newTag (parser) {
    if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]()
    var parent = parser.tags[parser.tags.length - 1] || parser
    var tag = parser.tag = { name: parser.tagName, attributes: {} }

    // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
    if (parser.opt.xmlns) {
      tag.ns = parent.ns
    }
    parser.attribList.length = 0
    emitNode(parser, 'onopentagstart', tag)
  }

  function qname (name, attribute) {
    var i = name.indexOf(':')
    var qualName = i < 0 ? [ '', name ] : name.split(':')
    var prefix = qualName[0]
    var local = qualName[1]

    // <x "xmlns"="http://foo">
    if (attribute && name === 'xmlns') {
      prefix = 'xmlns'
      local = ''
    }

    return { prefix: prefix, local: local }
  }

  function attrib (parser) {
    if (!parser.strict) {
      parser.attribName = parser.attribName[parser.looseCase]()
    }

    if (parser.attribList.indexOf(parser.attribName) !== -1 ||
      parser.tag.attributes.hasOwnProperty(parser.attribName)) {
      parser.attribName = parser.attribValue = ''
      return
    }

    if (parser.opt.xmlns) {
      var qn = qname(parser.attribName, true)
      var prefix = qn.prefix
      var local = qn.local

      if (prefix === 'xmlns') {
        // namespace binding attribute. push the binding into scope
        if (local === 'xml' && parser.attribValue !== XML_NAMESPACE) {
          strictFail(parser,
            'xml: prefix must be bound to ' + XML_NAMESPACE + '\n' +
            'Actual: ' + parser.attribValue)
        } else if (local === 'xmlns' && parser.attribValue !== XMLNS_NAMESPACE) {
          strictFail(parser,
            'xmlns: prefix must be bound to ' + XMLNS_NAMESPACE + '\n' +
            'Actual: ' + parser.attribValue)
        } else {
          var tag = parser.tag
          var parent = parser.tags[parser.tags.length - 1] || parser
          if (tag.ns === parent.ns) {
            tag.ns = Object.create(parent.ns)
          }
          tag.ns[local] = parser.attribValue
        }
      }

      // defer onattribute events until all attributes have been seen
      // so any new bindings can take effect. preserve attribute order
      // so deferred events can be emitted in document order
      parser.attribList.push([parser.attribName, parser.attribValue])
    } else {
      // in non-xmlns mode, we can emit the event right away
      parser.tag.attributes[parser.attribName] = parser.attribValue
      emitNode(parser, 'onattribute', {
        name: parser.attribName,
        value: parser.attribValue
      })
    }

    parser.attribName = parser.attribValue = ''
  }

  function openTag (parser, selfClosing) {
    if (parser.opt.xmlns) {
      // emit namespace binding events
      var tag = parser.tag

      // add namespace info to tag
      var qn = qname(parser.tagName)
      tag.prefix = qn.prefix
      tag.local = qn.local
      tag.uri = tag.ns[qn.prefix] || ''

      if (tag.prefix && !tag.uri) {
        strictFail(parser, 'Unbound namespace prefix: ' +
          JSON.stringify(parser.tagName))
        tag.uri = qn.prefix
      }

      var parent = parser.tags[parser.tags.length - 1] || parser
      if (tag.ns && parent.ns !== tag.ns) {
        Object.keys(tag.ns).forEach(function (p) {
          emitNode(parser, 'onopennamespace', {
            prefix: p,
            uri: tag.ns[p]
          })
        })
      }

      // handle deferred onattribute events
      // Note: do not apply default ns to attributes:
      //   http://www.w3.org/TR/REC-xml-names/#defaulting
      for (var i = 0, l = parser.attribList.length; i < l; i++) {
        var nv = parser.attribList[i]
        var name = nv[0]
        var value = nv[1]
        var qualName = qname(name, true)
        var prefix = qualName.prefix
        var local = qualName.local
        var uri = prefix === '' ? '' : (tag.ns[prefix] || '')
        var a = {
          name: name,
          value: value,
          prefix: prefix,
          local: local,
          uri: uri
        }

        // if there's any attributes with an undefined namespace,
        // then fail on them now.
        if (prefix && prefix !== 'xmlns' && !uri) {
          strictFail(parser, 'Unbound namespace prefix: ' +
            JSON.stringify(prefix))
          a.uri = prefix
        }
        parser.tag.attributes[name] = a
        emitNode(parser, 'onattribute', a)
      }
      parser.attribList.length = 0
    }

    parser.tag.isSelfClosing = !!selfClosing

    // process the tag
    parser.sawRoot = true
    parser.tags.push(parser.tag)
    emitNode(parser, 'onopentag', parser.tag)
    if (!selfClosing) {
      // special case for <script> in non-strict mode.
      if (!parser.noscript && parser.tagName.toLowerCase() === 'script') {
        parser.state = S.SCRIPT
      } else {
        parser.state = S.TEXT
      }
      parser.tag = null
      parser.tagName = ''
    }
    parser.attribName = parser.attribValue = ''
    parser.attribList.length = 0
  }

  function closeTag (parser) {
    if (!parser.tagName) {
      strictFail(parser, 'Weird empty close tag.')
      parser.textNode += '</>'
      parser.state = S.TEXT
      return
    }

    if (parser.script) {
      if (parser.tagName !== 'script') {
        parser.script += '</' + parser.tagName + '>'
        parser.tagName = ''
        parser.state = S.SCRIPT
        return
      }
      emitNode(parser, 'onscript', parser.script)
      parser.script = ''
    }

    // first make sure that the closing tag actually exists.
    // <a><b></c></b></a> will close everything, otherwise.
    var t = parser.tags.length
    var tagName = parser.tagName
    if (!parser.strict) {
      tagName = tagName[parser.looseCase]()
    }
    var closeTo = tagName
    while (t--) {
      var close = parser.tags[t]
      if (close.name !== closeTo) {
        // fail the first time in strict mode
        strictFail(parser, 'Unexpected close tag')
      } else {
        break
      }
    }

    // didn't find it.  we already failed for strict, so just abort.
    if (t < 0) {
      strictFail(parser, 'Unmatched closing tag: ' + parser.tagName)
      parser.textNode += '</' + parser.tagName + '>'
      parser.state = S.TEXT
      return
    }
    parser.tagName = tagName
    var s = parser.tags.length
    while (s-- > t) {
      var tag = parser.tag = parser.tags.pop()
      parser.tagName = parser.tag.name
      emitNode(parser, 'onclosetag', parser.tagName)

      var x = {}
      for (var i in tag.ns) {
        x[i] = tag.ns[i]
      }

      var parent = parser.tags[parser.tags.length - 1] || parser
      if (parser.opt.xmlns && tag.ns !== parent.ns) {
        // remove namespace bindings introduced by tag
        Object.keys(tag.ns).forEach(function (p) {
          var n = tag.ns[p]
          emitNode(parser, 'onclosenamespace', { prefix: p, uri: n })
        })
      }
    }
    if (t === 0) parser.closedRoot = true
    parser.tagName = parser.attribValue = parser.attribName = ''
    parser.attribList.length = 0
    parser.state = S.TEXT
  }

  function parseEntity (parser) {
    var entity = parser.entity
    var entityLC = entity.toLowerCase()
    var num
    var numStr = ''

    if (parser.ENTITIES[entity]) {
      return parser.ENTITIES[entity]
    }
    if (parser.ENTITIES[entityLC]) {
      return parser.ENTITIES[entityLC]
    }
    entity = entityLC
    if (entity.charAt(0) === '#') {
      if (entity.charAt(1) === 'x') {
        entity = entity.slice(2)
        num = parseInt(entity, 16)
        numStr = num.toString(16)
      } else {
        entity = entity.slice(1)
        num = parseInt(entity, 10)
        numStr = num.toString(10)
      }
    }
    entity = entity.replace(/^0+/, '')
    if (isNaN(num) || numStr.toLowerCase() !== entity) {
      strictFail(parser, 'Invalid character entity')
      return '&' + parser.entity + ';'
    }

    return String.fromCodePoint(num)
  }

  function beginWhiteSpace (parser, c) {
    if (c === '<') {
      parser.state = S.OPEN_WAKA
      parser.startTagPosition = parser.position
    } else if (!isWhitespace(c)) {
      // have to process this as a text node.
      // weird, but happens.
      strictFail(parser, 'Non-whitespace before first tag.')
      parser.textNode = c
      parser.state = S.TEXT
    }
  }

  function charAt (chunk, i) {
    var result = ''
    if (i < chunk.length) {
      result = chunk.charAt(i)
    }
    return result
  }

  function write (chunk) {
    var parser = this
    if (this.error) {
      throw this.error
    }
    if (parser.closed) {
      return error(parser,
        'Cannot write after close. Assign an onready handler.')
    }
    if (chunk === null) {
      return end(parser)
    }
    if (typeof chunk === 'object') {
      chunk = chunk.toString()
    }
    var i = 0
    var c = ''
    while (true) {
      c = charAt(chunk, i++)
      parser.c = c

      if (!c) {
        break
      }

      if (parser.trackPosition) {
        parser.position++
        if (c === '\n') {
          parser.line++
          parser.column = 0
        } else {
          parser.column++
        }
      }

      switch (parser.state) {
        case S.BEGIN:
          parser.state = S.BEGIN_WHITESPACE
          if (c === '\uFEFF') {
            continue
          }
          beginWhiteSpace(parser, c)
          continue

        case S.BEGIN_WHITESPACE:
          beginWhiteSpace(parser, c)
          continue

        case S.TEXT:
          if (parser.sawRoot && !parser.closedRoot) {
            var starti = i - 1
            while (c && c !== '<' && c !== '&') {
              c = charAt(chunk, i++)
              if (c && parser.trackPosition) {
                parser.position++
                if (c === '\n') {
                  parser.line++
                  parser.column = 0
                } else {
                  parser.column++
                }
              }
            }
            parser.textNode += chunk.substring(starti, i - 1)
          }
          if (c === '<' && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
            parser.state = S.OPEN_WAKA
            parser.startTagPosition = parser.position
          } else {
            if (!isWhitespace(c) && (!parser.sawRoot || parser.closedRoot)) {
              strictFail(parser, 'Text data outside of root node.')
            }
            if (c === '&') {
              parser.state = S.TEXT_ENTITY
            } else {
              parser.textNode += c
            }
          }
          continue

        case S.SCRIPT:
          // only non-strict
          if (c === '<') {
            parser.state = S.SCRIPT_ENDING
          } else {
            parser.script += c
          }
          continue

        case S.SCRIPT_ENDING:
          if (c === '/') {
            parser.state = S.CLOSE_TAG
          } else {
            parser.script += '<' + c
            parser.state = S.SCRIPT
          }
          continue

        case S.OPEN_WAKA:
          // either a /, ?, !, or text is coming next.
          if (c === '!') {
            parser.state = S.SGML_DECL
            parser.sgmlDecl = ''
          } else if (isWhitespace(c)) {
            // wait for it...
          } else if (isMatch(nameStart, c)) {
            parser.state = S.OPEN_TAG
            parser.tagName = c
          } else if (c === '/') {
            parser.state = S.CLOSE_TAG
            parser.tagName = ''
          } else if (c === '?') {
            parser.state = S.PROC_INST
            parser.procInstName = parser.procInstBody = ''
          } else {
            strictFail(parser, 'Unencoded <')
            // if there was some whitespace, then add that in.
            if (parser.startTagPosition + 1 < parser.position) {
              var pad = parser.position - parser.startTagPosition
              c = new Array(pad).join(' ') + c
            }
            parser.textNode += '<' + c
            parser.state = S.TEXT
          }
          continue

        case S.SGML_DECL:
          if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
            emitNode(parser, 'onopencdata')
            parser.state = S.CDATA
            parser.sgmlDecl = ''
            parser.cdata = ''
          } else if (parser.sgmlDecl + c === '--') {
            parser.state = S.COMMENT
            parser.comment = ''
            parser.sgmlDecl = ''
          } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
            parser.state = S.DOCTYPE
            if (parser.doctype || parser.sawRoot) {
              strictFail(parser,
                'Inappropriately located doctype declaration')
            }
            parser.doctype = ''
            parser.sgmlDecl = ''
          } else if (c === '>') {
            emitNode(parser, 'onsgmldeclaration', parser.sgmlDecl)
            parser.sgmlDecl = ''
            parser.state = S.TEXT
          } else if (isQuote(c)) {
            parser.state = S.SGML_DECL_QUOTED
            parser.sgmlDecl += c
          } else {
            parser.sgmlDecl += c
          }
          continue

        case S.SGML_DECL_QUOTED:
          if (c === parser.q) {
            parser.state = S.SGML_DECL
            parser.q = ''
          }
          parser.sgmlDecl += c
          continue

        case S.DOCTYPE:
          if (c === '>') {
            parser.state = S.TEXT
            emitNode(parser, 'ondoctype', parser.doctype)
            parser.doctype = true // just remember that we saw it.
          } else {
            parser.doctype += c
            if (c === '[') {
              parser.state = S.DOCTYPE_DTD
            } else if (isQuote(c)) {
              parser.state = S.DOCTYPE_QUOTED
              parser.q = c
            }
          }
          continue

        case S.DOCTYPE_QUOTED:
          parser.doctype += c
          if (c === parser.q) {
            parser.q = ''
            parser.state = S.DOCTYPE
          }
          continue

        case S.DOCTYPE_DTD:
          parser.doctype += c
          if (c === ']') {
            parser.state = S.DOCTYPE
          } else if (isQuote(c)) {
            parser.state = S.DOCTYPE_DTD_QUOTED
            parser.q = c
          }
          continue

        case S.DOCTYPE_DTD_QUOTED:
          parser.doctype += c
          if (c === parser.q) {
            parser.state = S.DOCTYPE_DTD
            parser.q = ''
          }
          continue

        case S.COMMENT:
          if (c === '-') {
            parser.state = S.COMMENT_ENDING
          } else {
            parser.comment += c
          }
          continue

        case S.COMMENT_ENDING:
          if (c === '-') {
            parser.state = S.COMMENT_ENDED
            parser.comment = textopts(parser.opt, parser.comment)
            if (parser.comment) {
              emitNode(parser, 'oncomment', parser.comment)
            }
            parser.comment = ''
          } else {
            parser.comment += '-' + c
            parser.state = S.COMMENT
          }
          continue

        case S.COMMENT_ENDED:
          if (c !== '>') {
            strictFail(parser, 'Malformed comment')
            // allow <!-- blah -- bloo --> in non-strict mode,
            // which is a comment of " blah -- bloo "
            parser.comment += '--' + c
            parser.state = S.COMMENT
          } else {
            parser.state = S.TEXT
          }
          continue

        case S.CDATA:
          if (c === ']') {
            parser.state = S.CDATA_ENDING
          } else {
            parser.cdata += c
          }
          continue

        case S.CDATA_ENDING:
          if (c === ']') {
            parser.state = S.CDATA_ENDING_2
          } else {
            parser.cdata += ']' + c
            parser.state = S.CDATA
          }
          continue

        case S.CDATA_ENDING_2:
          if (c === '>') {
            if (parser.cdata) {
              emitNode(parser, 'oncdata', parser.cdata)
            }
            emitNode(parser, 'onclosecdata')
            parser.cdata = ''
            parser.state = S.TEXT
          } else if (c === ']') {
            parser.cdata += ']'
          } else {
            parser.cdata += ']]' + c
            parser.state = S.CDATA
          }
          continue

        case S.PROC_INST:
          if (c === '?') {
            parser.state = S.PROC_INST_ENDING
          } else if (isWhitespace(c)) {
            parser.state = S.PROC_INST_BODY
          } else {
            parser.procInstName += c
          }
          continue

        case S.PROC_INST_BODY:
          if (!parser.procInstBody && isWhitespace(c)) {
            continue
          } else if (c === '?') {
            parser.state = S.PROC_INST_ENDING
          } else {
            parser.procInstBody += c
          }
          continue

        case S.PROC_INST_ENDING:
          if (c === '>') {
            emitNode(parser, 'onprocessinginstruction', {
              name: parser.procInstName,
              body: parser.procInstBody
            })
            parser.procInstName = parser.procInstBody = ''
            parser.state = S.TEXT
          } else {
            parser.procInstBody += '?' + c
            parser.state = S.PROC_INST_BODY
          }
          continue

        case S.OPEN_TAG:
          if (isMatch(nameBody, c)) {
            parser.tagName += c
          } else {
            newTag(parser)
            if (c === '>') {
              openTag(parser)
            } else if (c === '/') {
              parser.state = S.OPEN_TAG_SLASH
            } else {
              if (!isWhitespace(c)) {
                strictFail(parser, 'Invalid character in tag name')
              }
              parser.state = S.ATTRIB
            }
          }
          continue

        case S.OPEN_TAG_SLASH:
          if (c === '>') {
            openTag(parser, true)
            closeTag(parser)
          } else {
            strictFail(parser, 'Forward-slash in opening tag not followed by >')
            parser.state = S.ATTRIB
          }
          continue

        case S.ATTRIB:
          // haven't read the attribute name yet.
          if (isWhitespace(c)) {
            continue
          } else if (c === '>') {
            openTag(parser)
          } else if (c === '/') {
            parser.state = S.OPEN_TAG_SLASH
          } else if (isMatch(nameStart, c)) {
            parser.attribName = c
            parser.attribValue = ''
            parser.state = S.ATTRIB_NAME
          } else {
            strictFail(parser, 'Invalid attribute name')
          }
          continue

        case S.ATTRIB_NAME:
          if (c === '=') {
            parser.state = S.ATTRIB_VALUE
          } else if (c === '>') {
            strictFail(parser, 'Attribute without value')
            parser.attribValue = parser.attribName
            attrib(parser)
            openTag(parser)
          } else if (isWhitespace(c)) {
            parser.state = S.ATTRIB_NAME_SAW_WHITE
          } else if (isMatch(nameBody, c)) {
            parser.attribName += c
          } else {
            strictFail(parser, 'Invalid attribute name')
          }
          continue

        case S.ATTRIB_NAME_SAW_WHITE:
          if (c === '=') {
            parser.state = S.ATTRIB_VALUE
          } else if (isWhitespace(c)) {
            continue
          } else {
            strictFail(parser, 'Attribute without value')
            parser.tag.attributes[parser.attribName] = ''
            parser.attribValue = ''
            emitNode(parser, 'onattribute', {
              name: parser.attribName,
              value: ''
            })
            parser.attribName = ''
            if (c === '>') {
              openTag(parser)
            } else if (isMatch(nameStart, c)) {
              parser.attribName = c
              parser.state = S.ATTRIB_NAME
            } else {
              strictFail(parser, 'Invalid attribute name')
              parser.state = S.ATTRIB
            }
          }
          continue

        case S.ATTRIB_VALUE:
          if (isWhitespace(c)) {
            continue
          } else if (isQuote(c)) {
            parser.q = c
            parser.state = S.ATTRIB_VALUE_QUOTED
          } else {
            strictFail(parser, 'Unquoted attribute value')
            parser.state = S.ATTRIB_VALUE_UNQUOTED
            parser.attribValue = c
          }
          continue

        case S.ATTRIB_VALUE_QUOTED:
          if (c !== parser.q) {
            if (c === '&') {
              parser.state = S.ATTRIB_VALUE_ENTITY_Q
            } else {
              parser.attribValue += c
            }
            continue
          }
          attrib(parser)
          parser.q = ''
          parser.state = S.ATTRIB_VALUE_CLOSED
          continue

        case S.ATTRIB_VALUE_CLOSED:
          if (isWhitespace(c)) {
            parser.state = S.ATTRIB
          } else if (c === '>') {
            openTag(parser)
          } else if (c === '/') {
            parser.state = S.OPEN_TAG_SLASH
          } else if (isMatch(nameStart, c)) {
            strictFail(parser, 'No whitespace between attributes')
            parser.attribName = c
            parser.attribValue = ''
            parser.state = S.ATTRIB_NAME
          } else {
            strictFail(parser, 'Invalid attribute name')
          }
          continue

        case S.ATTRIB_VALUE_UNQUOTED:
          if (!isAttribEnd(c)) {
            if (c === '&') {
              parser.state = S.ATTRIB_VALUE_ENTITY_U
            } else {
              parser.attribValue += c
            }
            continue
          }
          attrib(parser)
          if (c === '>') {
            openTag(parser)
          } else {
            parser.state = S.ATTRIB
          }
          continue

        case S.CLOSE_TAG:
          if (!parser.tagName) {
            if (isWhitespace(c)) {
              continue
            } else if (notMatch(nameStart, c)) {
              if (parser.script) {
                parser.script += '</' + c
                parser.state = S.SCRIPT
              } else {
                strictFail(parser, 'Invalid tagname in closing tag.')
              }
            } else {
              parser.tagName = c
            }
          } else if (c === '>') {
            closeTag(parser)
          } else if (isMatch(nameBody, c)) {
            parser.tagName += c
          } else if (parser.script) {
            parser.script += '</' + parser.tagName
            parser.tagName = ''
            parser.state = S.SCRIPT
          } else {
            if (!isWhitespace(c)) {
              strictFail(parser, 'Invalid tagname in closing tag')
            }
            parser.state = S.CLOSE_TAG_SAW_WHITE
          }
          continue

        case S.CLOSE_TAG_SAW_WHITE:
          if (isWhitespace(c)) {
            continue
          }
          if (c === '>') {
            closeTag(parser)
          } else {
            strictFail(parser, 'Invalid characters in closing tag')
          }
          continue

        case S.TEXT_ENTITY:
        case S.ATTRIB_VALUE_ENTITY_Q:
        case S.ATTRIB_VALUE_ENTITY_U:
          var returnState
          var buffer
          switch (parser.state) {
            case S.TEXT_ENTITY:
              returnState = S.TEXT
              buffer = 'textNode'
              break

            case S.ATTRIB_VALUE_ENTITY_Q:
              returnState = S.ATTRIB_VALUE_QUOTED
              buffer = 'attribValue'
              break

            case S.ATTRIB_VALUE_ENTITY_U:
              returnState = S.ATTRIB_VALUE_UNQUOTED
              buffer = 'attribValue'
              break
          }

          if (c === ';') {
            parser[buffer] += parseEntity(parser)
            parser.entity = ''
            parser.state = returnState
          } else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
            parser.entity += c
          } else {
            strictFail(parser, 'Invalid character in entity name')
            parser[buffer] += '&' + parser.entity + c
            parser.entity = ''
            parser.state = returnState
          }

          continue

        default:
          throw new Error(parser, 'Unknown state: ' + parser.state)
      }
    } // while

    if (parser.position >= parser.bufferCheckPosition) {
      checkBufferLength(parser)
    }
    return parser
  }

  /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
  /* istanbul ignore next */
  if (!String.fromCodePoint) {
    (function () {
      var stringFromCharCode = String.fromCharCode
      var floor = Math.floor
      var fromCodePoint = function () {
        var MAX_SIZE = 0x4000
        var codeUnits = []
        var highSurrogate
        var lowSurrogate
        var index = -1
        var length = arguments.length
        if (!length) {
          return ''
        }
        var result = ''
        while (++index < length) {
          var codePoint = Number(arguments[index])
          if (
            !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
            codePoint < 0 || // not a valid Unicode code point
            codePoint > 0x10FFFF || // not a valid Unicode code point
            floor(codePoint) !== codePoint // not an integer
          ) {
            throw RangeError('Invalid code point: ' + codePoint)
          }
          if (codePoint <= 0xFFFF) { // BMP code point
            codeUnits.push(codePoint)
          } else { // Astral code point; split in surrogate halves
            // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            codePoint -= 0x10000
            highSurrogate = (codePoint >> 10) + 0xD800
            lowSurrogate = (codePoint % 0x400) + 0xDC00
            codeUnits.push(highSurrogate, lowSurrogate)
          }
          if (index + 1 === length || codeUnits.length > MAX_SIZE) {
            result += stringFromCharCode.apply(null, codeUnits)
            codeUnits.length = 0
          }
        }
        return result
      }
      /* istanbul ignore next */
      if (Object.defineProperty) {
        Object.defineProperty(String, 'fromCodePoint', {
          value: fromCodePoint,
          configurable: true,
          writable: true
        })
      } else {
        String.fromCodePoint = fromCodePoint
      }
    }())
  }
})( false ? this.sax = {} : exports)

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5).Buffer))

/***/ }),
/* 121 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}


/***/ }),
/* 122 */
/***/ (function(module, exports) {

exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),
/* 123 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 124 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = __webpack_require__(13).Buffer;
var util = __webpack_require__(125);

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}

/***/ }),
/* 125 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 126 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3), __webpack_require__(10)))

/***/ }),
/* 127 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {
/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 128 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.



module.exports = PassThrough;

var Transform = __webpack_require__(58);

/*<replacement>*/
var util = __webpack_require__(11);
util.inherits = __webpack_require__(6);
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

/***/ }),
/* 129 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(24);


/***/ }),
/* 130 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(4);


/***/ }),
/* 131 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(23).Transform


/***/ }),
/* 132 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(23).PassThrough


/***/ }),
/* 133 */
/***/ (function(module, exports, __webpack_require__) {

var helper = __webpack_require__(26);
var xml2js = __webpack_require__(51);

function validateOptions (userOptions) {
  var options = helper.copyOptions(userOptions);
  helper.ensureSpacesExists(options);
  return options;
}

module.exports = function(xml, userOptions) {
  var options, js, json, parentKey;
  options = validateOptions(userOptions);
  js = xml2js(xml, options);
  parentKey = 'compact' in options && options.compact ? '_parent' : 'parent';
  // parentKey = ptions.compact ? '_parent' : 'parent'; // consider this
  if ('addParent' in options && options.addParent) {
    json = JSON.stringify(js, function (k, v) { return k === parentKey? '_' : v; }, options.spaces);
  } else {
    json = JSON.stringify(js, null, options.spaces);
  }
  return json.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
};


/***/ }),
/* 134 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {var js2xml = __webpack_require__(59);

module.exports = function (json, options) {
  if (json instanceof Buffer) {
    json = json.toString();
  }
  var js = null;
  if (typeof (json) === 'string') {
    try {
      js = JSON.parse(json);
    } catch (e) {
      throw new Error('The JSON structure is invalid');
    }
  } else {
    js = json;
  }
  return js2xml(js, options);
};

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5).Buffer))

/***/ }),
/* 135 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKAROUND3 = "";


/***/ }),
/* 136 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class InitializableXmlComponent extends xml_components_1.XmlComponent {
    constructor(rootKey, initComponent) {
        super(rootKey);
        if (initComponent) {
            this.root = initComponent.root;
        }
    }
}
exports.InitializableXmlComponent = InitializableXmlComponent;


/***/ }),
/* 137 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class BorderAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            val: "w:val",
            color: "w:color",
            space: "w:space",
            sz: "w:sz",
        };
    }
}
exports.BorderAttributes = BorderAttributes;


/***/ }),
/* 138 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class Break extends xml_components_1.XmlComponent {
    constructor() {
        super("w:br");
    }
}
exports.Break = Break;


/***/ }),
/* 139 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const space_type_1 = __webpack_require__(14);
const xml_components_1 = __webpack_require__(0);
class TextAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { space: "xml:space" };
    }
}
class Page extends xml_components_1.XmlComponent {
    constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: space_type_1.SpaceType.PRESERVE }));
        this.root.push("PAGE");
    }
}
exports.Page = Page;
class NumberOfPages extends xml_components_1.XmlComponent {
    constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: space_type_1.SpaceType.PRESERVE }));
        this.root.push("NUMPAGES");
    }
}
exports.NumberOfPages = NumberOfPages;
class NumberOfPagesSection extends xml_components_1.XmlComponent {
    constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: space_type_1.SpaceType.PRESERVE }));
        this.root.push("SECTIONPAGES");
    }
}
exports.NumberOfPagesSection = NumberOfPagesSection;


/***/ }),
/* 140 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var underline_1 = __webpack_require__(15);
exports.Underline = underline_1.Underline;
var emphasis_mark_1 = __webpack_require__(30);
exports.EmphasisMark = emphasis_mark_1.EmphasisMark;
var script_1 = __webpack_require__(64);
exports.SubScript = script_1.SubScript;
exports.SuperScript = script_1.SuperScript;
var run_fonts_1 = __webpack_require__(31);
exports.RunFonts = run_fonts_1.RunFonts;
class Bold extends xml_components_1.XmlComponent {
    constructor() {
        super("w:b");
        this.root.push(new xml_components_1.Attributes({
            val: true,
        }));
    }
}
exports.Bold = Bold;
class BoldComplexScript extends xml_components_1.XmlComponent {
    constructor() {
        super("w:bCs");
        this.root.push(new xml_components_1.Attributes({
            val: true,
        }));
    }
}
exports.BoldComplexScript = BoldComplexScript;
class CharacterSpacing extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:spacing");
        this.root.push(new xml_components_1.Attributes({
            val: value,
        }));
    }
}
exports.CharacterSpacing = CharacterSpacing;
class Italics extends xml_components_1.XmlComponent {
    constructor() {
        super("w:i");
        this.root.push(new xml_components_1.Attributes({
            val: true,
        }));
    }
}
exports.Italics = Italics;
class ItalicsComplexScript extends xml_components_1.XmlComponent {
    constructor() {
        super("w:iCs");
        this.root.push(new xml_components_1.Attributes({
            val: true,
        }));
    }
}
exports.ItalicsComplexScript = ItalicsComplexScript;
class Caps extends xml_components_1.XmlComponent {
    constructor() {
        super("w:caps");
        this.root.push(new xml_components_1.Attributes({
            val: true,
        }));
    }
}
exports.Caps = Caps;
class Color extends xml_components_1.XmlComponent {
    constructor(color) {
        super("w:color");
        this.root.push(new xml_components_1.Attributes({
            val: color,
        }));
    }
}
exports.Color = Color;
class DoubleStrike extends xml_components_1.XmlComponent {
    constructor() {
        super("w:dstrike");
        this.root.push(new xml_components_1.Attributes({
            val: true,
        }));
    }
}
exports.DoubleStrike = DoubleStrike;
class Emboss extends xml_components_1.XmlComponent {
    constructor() {
        super("w:emboss");
        this.root.push(new xml_components_1.Attributes({
            val: true,
        }));
    }
}
exports.Emboss = Emboss;
class Imprint extends xml_components_1.XmlComponent {
    constructor() {
        super("w:imprint");
        this.root.push(new xml_components_1.Attributes({
            val: true,
        }));
    }
}
exports.Imprint = Imprint;
class SmallCaps extends xml_components_1.XmlComponent {
    constructor() {
        super("w:smallCaps");
        this.root.push(new xml_components_1.Attributes({
            val: true,
        }));
    }
}
exports.SmallCaps = SmallCaps;
class Strike extends xml_components_1.XmlComponent {
    constructor() {
        super("w:strike");
        this.root.push(new xml_components_1.Attributes({
            val: true,
        }));
    }
}
exports.Strike = Strike;
class Size extends xml_components_1.XmlComponent {
    constructor(size) {
        super("w:sz");
        this.root.push(new xml_components_1.Attributes({
            val: size,
        }));
    }
}
exports.Size = Size;
class SizeComplexScript extends xml_components_1.XmlComponent {
    constructor(size) {
        super("w:szCs");
        this.root.push(new xml_components_1.Attributes({
            val: size,
        }));
    }
}
exports.SizeComplexScript = SizeComplexScript;
class RightToLeft extends xml_components_1.XmlComponent {
    constructor() {
        super("w:rtl");
        this.root.push(new xml_components_1.Attributes({
            val: true,
        }));
    }
}
exports.RightToLeft = RightToLeft;
class Highlight extends xml_components_1.XmlComponent {
    constructor(color) {
        super("w:highlight");
        this.root.push(new xml_components_1.Attributes({
            val: color,
        }));
    }
}
exports.Highlight = Highlight;
class HighlightComplexScript extends xml_components_1.XmlComponent {
    constructor(color) {
        super("w:highlightCs");
        this.root.push(new xml_components_1.Attributes({
            val: color,
        }));
    }
}
exports.HighlightComplexScript = HighlightComplexScript;
class Shading extends xml_components_1.XmlComponent {
    constructor(value, fill, color) {
        super("w:shd");
        this.root.push(new xml_components_1.Attributes({
            val: value,
            fill: fill,
            color: color,
        }));
    }
}
exports.Shading = Shading;
class ShadowComplexScript extends xml_components_1.XmlComponent {
    constructor(value, fill, color) {
        super("w:shdCs");
        this.root.push(new xml_components_1.Attributes({
            val: value,
            fill: fill,
            color: color,
        }));
    }
}
exports.ShadowComplexScript = ShadowComplexScript;


/***/ }),
/* 141 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const run_1 = __webpack_require__(28);
const text_1 = __webpack_require__(66);
class TextRun extends run_1.Run {
    constructor(options) {
        if (typeof options === "string") {
            super({});
            this.root.push(new text_1.Text(options));
            return;
        }
        super(options);
    }
}
exports.TextRun = TextRun;


/***/ }),
/* 142 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const run_1 = __webpack_require__(28);
const symbol_1 = __webpack_require__(143);
class SymbolRun extends run_1.Run {
    constructor(options) {
        if (typeof options === "string") {
            super({});
            this.root.push(new symbol_1.Symbol(options));
            return;
        }
        super(options);
        this.root.push(new symbol_1.Symbol(options.char, options.symbolfont));
    }
}
exports.SymbolRun = SymbolRun;


/***/ }),
/* 143 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class SymbolAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            char: "w:char",
            symbolfont: "w:font",
        };
    }
}
class Symbol extends xml_components_1.XmlComponent {
    constructor(char = "", symbolfont = "Wingdings") {
        super("w:sym");
        this.root.push(new SymbolAttributes({ char: char, symbolfont: symbolfont }));
    }
}
exports.Symbol = Symbol;


/***/ }),
/* 144 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const drawing_1 = __webpack_require__(67);
const run_1 = __webpack_require__(2);
class PictureRun extends run_1.Run {
    constructor(imageData, drawingOptions) {
        super({});
        const drawing = new drawing_1.Drawing(imageData, drawingOptions);
        this.root.push(drawing);
    }
}
exports.PictureRun = PictureRun;


/***/ }),
/* 145 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const anchor_1 = __webpack_require__(146);
const inline_1 = __webpack_require__(189);
class Drawing extends xml_components_1.XmlComponent {
    constructor(imageData, drawingOptions = {}) {
        super("w:drawing");
        if (!drawingOptions.floating) {
            this.inline = new inline_1.Inline(imageData, imageData.dimensions);
            this.root.push(this.inline);
        }
        else {
            this.root.push(new anchor_1.Anchor(imageData, imageData.dimensions, drawingOptions));
        }
    }
    scale(factorX, factorY) {
        this.inline.scale(factorX, factorY);
    }
}
exports.Drawing = Drawing;


/***/ }),
/* 146 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(147));
__export(__webpack_require__(76));


/***/ }),
/* 147 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const floating_1 = __webpack_require__(68);
const graphic_1 = __webpack_require__(71);
const text_wrap_1 = __webpack_require__(33);
const doc_properties_1 = __webpack_require__(72);
const effect_extent_1 = __webpack_require__(73);
const extent_1 = __webpack_require__(74);
const graphic_frame_properties_1 = __webpack_require__(75);
const anchor_attributes_1 = __webpack_require__(76);
const defaultOptions = {
    allowOverlap: true,
    behindDocument: false,
    lockAnchor: false,
    layoutInCell: true,
    verticalPosition: {},
    horizontalPosition: {},
};
class Anchor extends xml_components_1.XmlComponent {
    constructor(mediaData, dimensions, drawingOptions) {
        super("wp:anchor");
        const floating = Object.assign({ margins: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            } }, defaultOptions, drawingOptions.floating);
        this.root.push(new anchor_attributes_1.AnchorAttributes({
            distT: floating.margins.top || 0,
            distB: floating.margins.bottom || 0,
            distL: floating.margins.left || 0,
            distR: floating.margins.right || 0,
            simplePos: "0",
            allowOverlap: floating.allowOverlap === true ? "1" : "0",
            behindDoc: floating.behindDocument === true ? "1" : "0",
            locked: floating.lockAnchor === true ? "1" : "0",
            layoutInCell: floating.layoutInCell === true ? "1" : "0",
            relativeHeight: dimensions.emus.y,
        }));
        this.root.push(new floating_1.SimplePos());
        this.root.push(new floating_1.HorizontalPosition(floating.horizontalPosition));
        this.root.push(new floating_1.VerticalPosition(floating.verticalPosition));
        this.root.push(new extent_1.Extent(dimensions.emus.x, dimensions.emus.y));
        this.root.push(new effect_extent_1.EffectExtent());
        if (drawingOptions.floating !== undefined && drawingOptions.floating.wrap !== undefined) {
            switch (drawingOptions.floating.wrap.type) {
                case text_wrap_1.TextWrappingType.SQUARE:
                    this.root.push(new text_wrap_1.WrapSquare(drawingOptions.floating.wrap, drawingOptions.floating.margins));
                    break;
                case text_wrap_1.TextWrappingType.TIGHT:
                    this.root.push(new text_wrap_1.WrapTight(drawingOptions.floating.margins));
                    break;
                case text_wrap_1.TextWrappingType.TOP_AND_BOTTOM:
                    this.root.push(new text_wrap_1.WrapTopAndBottom(drawingOptions.floating.margins));
                    break;
                case text_wrap_1.TextWrappingType.NONE:
                default:
                    this.root.push(new text_wrap_1.WrapNone());
            }
        }
        else {
            this.root.push(new text_wrap_1.WrapNone());
        }
        this.root.push(new doc_properties_1.DocProperties());
        this.root.push(new graphic_frame_properties_1.GraphicFrameProperties());
        this.root.push(new graphic_1.Graphic(mediaData, dimensions.emus.x, dimensions.emus.y));
    }
}
exports.Anchor = Anchor;


/***/ }),
/* 148 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class SimplePosAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            x: "x",
            y: "y",
        };
    }
}
class SimplePos extends xml_components_1.XmlComponent {
    constructor() {
        super("wp:simplePos");
        this.root.push(new SimplePosAttributes({
            x: 0,
            y: 0,
        }));
    }
}
exports.SimplePos = SimplePos;


/***/ }),
/* 149 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const align_1 = __webpack_require__(69);
const floating_position_1 = __webpack_require__(32);
const position_offset_1 = __webpack_require__(70);
class HorizontalPositionAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            relativeFrom: "relativeFrom",
        };
    }
}
class HorizontalPosition extends xml_components_1.XmlComponent {
    constructor(horizontalPosition) {
        super("wp:positionH");
        this.root.push(new HorizontalPositionAttributes({
            relativeFrom: horizontalPosition.relative || floating_position_1.HorizontalPositionRelativeFrom.PAGE,
        }));
        if (horizontalPosition.align) {
            this.root.push(new align_1.Align(horizontalPosition.align));
        }
        else if (horizontalPosition.offset !== undefined) {
            this.root.push(new position_offset_1.PositionOffset(horizontalPosition.offset));
        }
        else {
            throw new Error("There is no configuration provided for floating position (Align or offset)");
        }
    }
}
exports.HorizontalPosition = HorizontalPosition;


/***/ }),
/* 150 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const align_1 = __webpack_require__(69);
const floating_position_1 = __webpack_require__(32);
const position_offset_1 = __webpack_require__(70);
class VerticalPositionAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            relativeFrom: "relativeFrom",
        };
    }
}
class VerticalPosition extends xml_components_1.XmlComponent {
    constructor(verticalPosition) {
        super("wp:positionV");
        this.root.push(new VerticalPositionAttributes({
            relativeFrom: verticalPosition.relative || floating_position_1.VerticalPositionRelativeFrom.PAGE,
        }));
        if (verticalPosition.align) {
            this.root.push(new align_1.Align(verticalPosition.align));
        }
        else if (verticalPosition.offset !== undefined) {
            this.root.push(new position_offset_1.PositionOffset(verticalPosition.offset));
        }
        else {
            throw new Error("There is no configuration provided for floating position (Align or offset)");
        }
    }
}
exports.VerticalPosition = VerticalPosition;


/***/ }),
/* 151 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const graphic_data_1 = __webpack_require__(152);
class GraphicAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            a: "xmlns:a",
        };
    }
}
class Graphic extends xml_components_1.XmlComponent {
    constructor(mediaData, x, y) {
        super("a:graphic");
        this.root.push(new GraphicAttributes({
            a: "http://schemas.openxmlformats.org/drawingml/2006/main",
        }));
        this.data = new graphic_data_1.GraphicData(mediaData, x, y);
        this.root.push(this.data);
    }
    setXY(x, y) {
        this.data.setXY(x, y);
    }
}
exports.Graphic = Graphic;


/***/ }),
/* 152 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(153));


/***/ }),
/* 153 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const graphic_data_attribute_1 = __webpack_require__(154);
const pic_1 = __webpack_require__(155);
class GraphicData extends xml_components_1.XmlComponent {
    constructor(mediaData, x, y) {
        super("a:graphicData");
        this.root.push(new graphic_data_attribute_1.GraphicDataAttributes({
            uri: "http://schemas.openxmlformats.org/drawingml/2006/picture",
        }));
        this.pic = new pic_1.Pic(mediaData, x, y);
        this.root.push(this.pic);
    }
    setXY(x, y) {
        this.pic.setXY(x, y);
    }
}
exports.GraphicData = GraphicData;


/***/ }),
/* 154 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class GraphicDataAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            uri: "uri",
        };
    }
}
exports.GraphicDataAttributes = GraphicDataAttributes;


/***/ }),
/* 155 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(156));


/***/ }),
/* 156 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const blip_fill_1 = __webpack_require__(157);
const non_visual_pic_properties_1 = __webpack_require__(161);
const pic_attributes_1 = __webpack_require__(167);
const shape_properties_1 = __webpack_require__(168);
class Pic extends xml_components_1.XmlComponent {
    constructor(mediaData, x, y) {
        super("pic:pic");
        this.root.push(new pic_attributes_1.PicAttributes({
            xmlns: "http://schemas.openxmlformats.org/drawingml/2006/picture",
        }));
        this.shapeProperties = new shape_properties_1.ShapeProperties(x, y);
        this.root.push(new non_visual_pic_properties_1.NonVisualPicProperties());
        this.root.push(new blip_fill_1.BlipFill(mediaData));
        this.root.push(new shape_properties_1.ShapeProperties(x, y));
    }
    setXY(x, y) {
        this.shapeProperties.setXY(x, y);
    }
}
exports.Pic = Pic;


/***/ }),
/* 157 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const blip_1 = __webpack_require__(158);
const source_rectangle_1 = __webpack_require__(159);
const stretch_1 = __webpack_require__(160);
class BlipFill extends xml_components_1.XmlComponent {
    constructor(mediaData) {
        super("pic:blipFill");
        this.root.push(new blip_1.Blip(mediaData));
        this.root.push(new source_rectangle_1.SourceRectangle());
        this.root.push(new stretch_1.Stretch());
    }
}
exports.BlipFill = BlipFill;


/***/ }),
/* 158 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class BlipAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            embed: "r:embed",
            cstate: "cstate",
        };
    }
}
class Blip extends xml_components_1.XmlComponent {
    constructor(mediaData) {
        super("a:blip");
        this.root.push(new BlipAttributes({
            embed: `rId{${mediaData.fileName}}`,
            cstate: "none",
        }));
    }
}
exports.Blip = Blip;


/***/ }),
/* 159 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class SourceRectangle extends xml_components_1.XmlComponent {
    constructor() {
        super("a:srcRect");
    }
}
exports.SourceRectangle = SourceRectangle;


/***/ }),
/* 160 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class FillRectangle extends xml_components_1.XmlComponent {
    constructor() {
        super("a:fillRect");
    }
}
class Stretch extends xml_components_1.XmlComponent {
    constructor() {
        super("a:stretch");
        this.root.push(new FillRectangle());
    }
}
exports.Stretch = Stretch;


/***/ }),
/* 161 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const child_non_visual_pic_properties_1 = __webpack_require__(162);
const non_visual_properties_1 = __webpack_require__(165);
class NonVisualPicProperties extends xml_components_1.XmlComponent {
    constructor() {
        super("pic:nvPicPr");
        this.root.push(new non_visual_properties_1.NonVisualProperties());
        this.root.push(new child_non_visual_pic_properties_1.ChildNonVisualProperties());
    }
}
exports.NonVisualPicProperties = NonVisualPicProperties;


/***/ }),
/* 162 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const pic_locks_1 = __webpack_require__(163);
class ChildNonVisualProperties extends xml_components_1.XmlComponent {
    constructor() {
        super("pic:cNvPicPr");
        this.root.push(new pic_locks_1.PicLocks());
    }
}
exports.ChildNonVisualProperties = ChildNonVisualProperties;


/***/ }),
/* 163 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const pic_locks_attributes_1 = __webpack_require__(164);
class PicLocks extends xml_components_1.XmlComponent {
    constructor() {
        super("a:picLocks");
        this.root.push(new pic_locks_attributes_1.PicLocksAttributes({
            noChangeAspect: 1,
            noChangeArrowheads: 1,
        }));
    }
}
exports.PicLocks = PicLocks;


/***/ }),
/* 164 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class PicLocksAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            noChangeAspect: "noChangeAspect",
            noChangeArrowheads: "noChangeArrowheads",
        };
    }
}
exports.PicLocksAttributes = PicLocksAttributes;


/***/ }),
/* 165 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const non_visual_properties_attributes_1 = __webpack_require__(166);
class NonVisualProperties extends xml_components_1.XmlComponent {
    constructor() {
        super("pic:cNvPr");
        this.root.push(new non_visual_properties_attributes_1.NonVisualPropertiesAttributes({
            id: 0,
            name: "",
            descr: "",
        }));
    }
}
exports.NonVisualProperties = NonVisualProperties;


/***/ }),
/* 166 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class NonVisualPropertiesAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            id: "id",
            name: "name",
            descr: "desc",
        };
    }
}
exports.NonVisualPropertiesAttributes = NonVisualPropertiesAttributes;


/***/ }),
/* 167 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class PicAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            xmlns: "xmlns:pic",
        };
    }
}
exports.PicAttributes = PicAttributes;


/***/ }),
/* 168 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const form_1 = __webpack_require__(169);
const preset_geometry_1 = __webpack_require__(175);
const shape_properties_attributes_1 = __webpack_require__(178);
class ShapeProperties extends xml_components_1.XmlComponent {
    constructor(x, y) {
        super("pic:spPr");
        this.root.push(new shape_properties_attributes_1.ShapePropertiesAttributes({
            bwMode: "auto",
        }));
        this.form = new form_1.Form(x, y);
        this.root.push(this.form);
        this.root.push(new preset_geometry_1.PresetGeometry());
    }
    setXY(x, y) {
        this.form.setXY(x, y);
    }
}
exports.ShapeProperties = ShapeProperties;


/***/ }),
/* 169 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(170));


/***/ }),
/* 170 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const extents_1 = __webpack_require__(171);
const off_1 = __webpack_require__(173);
class Form extends xml_components_1.XmlComponent {
    constructor(x, y) {
        super("a:xfrm");
        this.extents = new extents_1.Extents(x, y);
        this.root.push(this.extents);
        this.root.push(new off_1.Offset());
    }
    setXY(x, y) {
        this.extents.setXY(x, y);
    }
}
exports.Form = Form;


/***/ }),
/* 171 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const extents_attributes_1 = __webpack_require__(172);
class Extents extends xml_components_1.XmlComponent {
    constructor(x, y) {
        super("a:ext");
        this.attributes = new extents_attributes_1.ExtentsAttributes({
            cx: x,
            cy: y,
        });
        this.root.push(this.attributes);
    }
    setXY(x, y) {
        this.attributes.set({
            cx: x,
            cy: y,
        });
    }
}
exports.Extents = Extents;


/***/ }),
/* 172 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class ExtentsAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            cx: "cx",
            cy: "cy",
        };
    }
}
exports.ExtentsAttributes = ExtentsAttributes;


/***/ }),
/* 173 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const off_attributes_1 = __webpack_require__(174);
class Offset extends xml_components_1.XmlComponent {
    constructor() {
        super("a:off");
        this.root.push(new off_attributes_1.OffsetAttributes({
            x: 0,
            y: 0,
        }));
    }
}
exports.Offset = Offset;


/***/ }),
/* 174 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class OffsetAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            x: "x",
            y: "y",
        };
    }
}
exports.OffsetAttributes = OffsetAttributes;


/***/ }),
/* 175 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const adjustment_values_1 = __webpack_require__(176);
const preset_geometry_attributes_1 = __webpack_require__(177);
class PresetGeometry extends xml_components_1.XmlComponent {
    constructor() {
        super("a:prstGeom");
        this.root.push(new preset_geometry_attributes_1.PresetGeometryAttributes({
            prst: "rect",
        }));
        this.root.push(new adjustment_values_1.AdjustmentValues());
    }
}
exports.PresetGeometry = PresetGeometry;


/***/ }),
/* 176 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class AdjustmentValues extends xml_components_1.XmlComponent {
    constructor() {
        super("a:avLst");
    }
}
exports.AdjustmentValues = AdjustmentValues;


/***/ }),
/* 177 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class PresetGeometryAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            prst: "prst",
        };
    }
}
exports.PresetGeometryAttributes = PresetGeometryAttributes;


/***/ }),
/* 178 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class ShapePropertiesAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            bwMode: "bwMode",
        };
    }
}
exports.ShapePropertiesAttributes = ShapePropertiesAttributes;


/***/ }),
/* 179 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var TextWrappingType;
(function (TextWrappingType) {
    TextWrappingType[TextWrappingType["NONE"] = 0] = "NONE";
    TextWrappingType[TextWrappingType["SQUARE"] = 1] = "SQUARE";
    TextWrappingType[TextWrappingType["TIGHT"] = 2] = "TIGHT";
    TextWrappingType[TextWrappingType["TOP_AND_BOTTOM"] = 3] = "TOP_AND_BOTTOM";
})(TextWrappingType = exports.TextWrappingType || (exports.TextWrappingType = {}));
var TextWrappingSide;
(function (TextWrappingSide) {
    TextWrappingSide["BOTH_SIDES"] = "bothSides";
    TextWrappingSide["LEFT"] = "left";
    TextWrappingSide["RIGHT"] = "right";
    TextWrappingSide["LARGEST"] = "largest";
})(TextWrappingSide = exports.TextWrappingSide || (exports.TextWrappingSide = {}));


/***/ }),
/* 180 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class WrapNone extends xml_components_1.XmlComponent {
    constructor() {
        super("wp:wrapNone");
    }
}
exports.WrapNone = WrapNone;


/***/ }),
/* 181 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const _1 = __webpack_require__(33);
class WrapSquareAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            distT: "distT",
            distB: "distB",
            distL: "distL",
            distR: "distR",
            wrapText: "wrapText",
        };
    }
}
class WrapSquare extends xml_components_1.XmlComponent {
    constructor(textWrapping, margins = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    }) {
        super("wp:wrapSquare");
        this.root.push(new WrapSquareAttributes({
            wrapText: textWrapping.side || _1.TextWrappingSide.BOTH_SIDES,
            distT: margins.top,
            distB: margins.bottom,
            distL: margins.left,
            distR: margins.right,
        }));
    }
}
exports.WrapSquare = WrapSquare;


/***/ }),
/* 182 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class WrapTightAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            distT: "distT",
            distB: "distB",
        };
    }
}
class WrapTight extends xml_components_1.XmlComponent {
    constructor(margins = {
        top: 0,
        bottom: 0,
    }) {
        super("wp:wrapTight");
        this.root.push(new WrapTightAttributes({
            distT: margins.top,
            distB: margins.bottom,
        }));
    }
}
exports.WrapTight = WrapTight;


/***/ }),
/* 183 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class WrapTopAndBottomAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            distT: "distT",
            distB: "distB",
        };
    }
}
class WrapTopAndBottom extends xml_components_1.XmlComponent {
    constructor(margins = {
        top: 0,
        bottom: 0,
    }) {
        super("wp:wrapTopAndBottom");
        this.root.push(new WrapTopAndBottomAttributes({
            distT: margins.top,
            distB: margins.bottom,
        }));
    }
}
exports.WrapTopAndBottom = WrapTopAndBottom;


/***/ }),
/* 184 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class DocPropertiesAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            id: "id",
            name: "name",
            descr: "descr",
        };
    }
}
exports.DocPropertiesAttributes = DocPropertiesAttributes;


/***/ }),
/* 185 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class EffectExtentAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            b: "b",
            l: "l",
            r: "r",
            t: "t",
        };
    }
}
exports.EffectExtentAttributes = EffectExtentAttributes;


/***/ }),
/* 186 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class ExtentAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            cx: "cx",
            cy: "cy",
        };
    }
}
exports.ExtentAttributes = ExtentAttributes;


/***/ }),
/* 187 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const graphic_frame_lock_attributes_1 = __webpack_require__(188);
class GraphicFrameLocks extends xml_components_1.XmlComponent {
    constructor() {
        super("a:graphicFrameLocks");
        this.root.push(new graphic_frame_lock_attributes_1.GraphicFrameLockAttributes({
            xmlns: "http://schemas.openxmlformats.org/drawingml/2006/main",
            noChangeAspect: 1,
        }));
    }
}
exports.GraphicFrameLocks = GraphicFrameLocks;


/***/ }),
/* 188 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class GraphicFrameLockAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            xmlns: "xmlns:a",
            noChangeAspect: "noChangeAspect",
        };
    }
}
exports.GraphicFrameLockAttributes = GraphicFrameLockAttributes;


/***/ }),
/* 189 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(190));


/***/ }),
/* 190 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const doc_properties_1 = __webpack_require__(72);
const effect_extent_1 = __webpack_require__(73);
const extent_1 = __webpack_require__(74);
const graphic_frame_properties_1 = __webpack_require__(75);
const graphic_1 = __webpack_require__(71);
const inline_attributes_1 = __webpack_require__(191);
class Inline extends xml_components_1.XmlComponent {
    constructor(mediaData, dimensions) {
        super("wp:inline");
        this.mediaData = mediaData;
        this.dimensions = dimensions;
        this.root.push(new inline_attributes_1.InlineAttributes({
            distT: 0,
            distB: 0,
            distL: 0,
            distR: 0,
        }));
        this.extent = new extent_1.Extent(dimensions.emus.x, dimensions.emus.y);
        this.graphic = new graphic_1.Graphic(mediaData, dimensions.emus.x, dimensions.emus.y);
        this.root.push(this.extent);
        this.root.push(new effect_extent_1.EffectExtent());
        this.root.push(new doc_properties_1.DocProperties());
        this.root.push(new graphic_frame_properties_1.GraphicFrameProperties());
        this.root.push(this.graphic);
    }
    scale(factorX, factorY) {
        const newX = Math.round(this.dimensions.emus.x * factorX);
        const newY = Math.round(this.dimensions.emus.y * factorY);
        this.extent.setXY(newX, newY);
        this.graphic.setXY(newX, newY);
    }
}
exports.Inline = Inline;


/***/ }),
/* 191 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class InlineAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            distT: "distT",
            distB: "distB",
            distL: "distL",
            distR: "distR",
        };
    }
}
exports.InlineAttributes = InlineAttributes;


/***/ }),
/* 192 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const run_1 = __webpack_require__(2);
const field_1 = __webpack_require__(29);
const sequential_identifier_instruction_1 = __webpack_require__(193);
class SequentialIdentifier extends run_1.Run {
    constructor(identifier) {
        super({});
        this.root.push(new field_1.Begin(true));
        this.root.push(new sequential_identifier_instruction_1.SequentialIdentifierInstruction(identifier));
        this.root.push(new field_1.Separate());
        this.root.push(new field_1.End());
    }
}
exports.SequentialIdentifier = SequentialIdentifier;


/***/ }),
/* 193 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const space_type_1 = __webpack_require__(14);
const xml_components_1 = __webpack_require__(0);
class TextAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { space: "xml:space" };
    }
}
class SequentialIdentifierInstruction extends xml_components_1.XmlComponent {
    constructor(identifier) {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: space_type_1.SpaceType.PRESERVE }));
        this.root.push(`SEQ ${identifier}`);
    }
}
exports.SequentialIdentifierInstruction = SequentialIdentifierInstruction;


/***/ }),
/* 194 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class Tab extends xml_components_1.XmlComponent {
    constructor() {
        super("w:tab");
    }
}
exports.Tab = Tab;


/***/ }),
/* 195 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const links_1 = __webpack_require__(34);
const properties_1 = __webpack_require__(17);
const run_1 = __webpack_require__(2);
class Paragraph extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:p");
        if (typeof options === "string") {
            this.properties = new properties_1.ParagraphProperties({});
            this.root.push(this.properties);
            this.root.push(new run_1.TextRun(options));
            return;
        }
        if (options instanceof run_1.PictureRun) {
            this.properties = new properties_1.ParagraphProperties({});
            this.root.push(this.properties);
            this.root.push(options);
            return;
        }
        this.properties = new properties_1.ParagraphProperties(options);
        this.root.push(this.properties);
        if (options.text) {
            this.root.push(new run_1.TextRun(options.text));
        }
        if (options.children) {
            for (const child of options.children) {
                if (child instanceof links_1.Bookmark) {
                    this.root.push(child.start);
                    this.root.push(child.text);
                    this.root.push(child.end);
                    continue;
                }
                this.root.push(child);
            }
        }
    }
    prepForXml(file) {
        for (const element of this.root) {
            if (element instanceof links_1.HyperlinkRef) {
                const index = this.root.indexOf(element);
                this.root[index] = file.HyperlinkCache[element.id];
            }
        }
        return super.prepForXml();
    }
    addRunToFront(run) {
        this.root.splice(1, 0, run);
        return this;
    }
}
exports.Paragraph = Paragraph;


/***/ }),
/* 196 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const run_1 = __webpack_require__(2);
const hyperlink_attributes_1 = __webpack_require__(197);
var HyperlinkType;
(function (HyperlinkType) {
    HyperlinkType["INTERNAL"] = "INTERNAL";
    HyperlinkType["EXTERNAL"] = "EXTERNAL";
})(HyperlinkType = exports.HyperlinkType || (exports.HyperlinkType = {}));
class HyperlinkRef {
    constructor(id) {
        this.id = id;
    }
}
exports.HyperlinkRef = HyperlinkRef;
class Hyperlink extends xml_components_1.XmlComponent {
    constructor(text, relationshipId, anchor) {
        super("w:hyperlink");
        this.linkId = relationshipId;
        const props = {
            history: 1,
            anchor: anchor ? anchor : undefined,
            id: !anchor ? `rId${this.linkId}` : undefined,
        };
        const attributes = new hyperlink_attributes_1.HyperlinkAttributes(props);
        this.root.push(attributes);
        this.textRun = new run_1.TextRun({
            text: text,
            style: "Hyperlink",
        });
        this.root.push(this.textRun);
    }
    get TextRun() {
        return this.textRun;
    }
}
exports.Hyperlink = Hyperlink;


/***/ }),
/* 197 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class HyperlinkAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            id: "r:id",
            history: "w:history",
            anchor: "w:anchor",
        };
    }
}
exports.HyperlinkAttributes = HyperlinkAttributes;


/***/ }),
/* 198 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const shortid = __webpack_require__(81);
const run_1 = __webpack_require__(2);
const bookmark_attributes_1 = __webpack_require__(207);
class Bookmark {
    constructor(name, text) {
        const linkId = shortid.generate().toLowerCase();
        this.start = new BookmarkStart(name, linkId);
        this.text = new run_1.TextRun(text);
        this.end = new BookmarkEnd(linkId);
    }
}
exports.Bookmark = Bookmark;
class BookmarkStart extends xml_components_1.XmlComponent {
    constructor(name, linkId) {
        super("w:bookmarkStart");
        const attributes = new bookmark_attributes_1.BookmarkStartAttributes({
            name,
            id: linkId,
        });
        this.root.push(attributes);
    }
}
exports.BookmarkStart = BookmarkStart;
class BookmarkEnd extends xml_components_1.XmlComponent {
    constructor(linkId) {
        super("w:bookmarkEnd");
        const attributes = new bookmark_attributes_1.BookmarkEndAttributes({
            id: linkId,
        });
        this.root.push(attributes);
    }
}
exports.BookmarkEnd = BookmarkEnd;


/***/ }),
/* 199 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var alphabet = __webpack_require__(16);
var build = __webpack_require__(201);
var isValid = __webpack_require__(205);

// if you are using cluster or multiple servers use this to make each instance
// has a unique value for worker
// Note: I don't know if this is automatically set when using third
// party cluster solutions such as pm2.
var clusterWorkerId = __webpack_require__(206) || 0;

/**
 * Set the seed.
 * Highly recommended if you don't want people to try to figure out your id schema.
 * exposed as shortid.seed(int)
 * @param seed Integer value to seed the random alphabet.  ALWAYS USE THE SAME SEED or you might get overlaps.
 */
function seed(seedValue) {
    alphabet.seed(seedValue);
    return module.exports;
}

/**
 * Set the cluster worker or machine id
 * exposed as shortid.worker(int)
 * @param workerId worker must be positive integer.  Number less than 16 is recommended.
 * returns shortid module so it can be chained.
 */
function worker(workerId) {
    clusterWorkerId = workerId;
    return module.exports;
}

/**
 *
 * sets new characters to use in the alphabet
 * returns the shuffled alphabet
 */
function characters(newCharacters) {
    if (newCharacters !== undefined) {
        alphabet.characters(newCharacters);
    }

    return alphabet.shuffled();
}

/**
 * Generate unique id
 * Returns string id
 */
function generate() {
  return build(clusterWorkerId);
}

// Export all other functions as properties of the generate function
module.exports = generate;
module.exports.generate = generate;
module.exports.seed = seed;
module.exports.worker = worker;
module.exports.characters = characters;
module.exports.isValid = isValid;


/***/ }),
/* 200 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Found this seed-based random generator somewhere
// Based on The Central Randomizer 1.3 (C) 1997 by Paul Houle (houle@msc.cornell.edu)

var seed = 1;

/**
 * return a random number based on a seed
 * @param seed
 * @returns {number}
 */
function getNextValue() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed/(233280.0);
}

function setSeed(_seed_) {
    seed = _seed_;
}

module.exports = {
    nextValue: getNextValue,
    seed: setSeed
};


/***/ }),
/* 201 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var generate = __webpack_require__(202);
var alphabet = __webpack_require__(16);

// Ignore all milliseconds before a certain time to reduce the size of the date entropy without sacrificing uniqueness.
// This number should be updated every year or so to keep the generated id short.
// To regenerate `new Date() - 0` and bump the version. Always bump the version!
var REDUCE_TIME = 1567752802062;

// don't change unless we change the algos or REDUCE_TIME
// must be an integer and less than 16
var version = 7;

// Counter is used when shortid is called multiple times in one second.
var counter;

// Remember the last time shortid was called in case counter is needed.
var previousSeconds;

/**
 * Generate unique id
 * Returns string id
 */
function build(clusterWorkerId) {
    var str = '';

    var seconds = Math.floor((Date.now() - REDUCE_TIME) * 0.001);

    if (seconds === previousSeconds) {
        counter++;
    } else {
        counter = 0;
        previousSeconds = seconds;
    }

    str = str + generate(version);
    str = str + generate(clusterWorkerId);
    if (counter > 0) {
        str = str + generate(counter);
    }
    str = str + generate(seconds);
    return str;
}

module.exports = build;


/***/ }),
/* 202 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var alphabet = __webpack_require__(16);
var random = __webpack_require__(203);
var format = __webpack_require__(204);

function generate(number) {
    var loopCounter = 0;
    var done;

    var str = '';

    while (!done) {
        str = str + format(random, alphabet.get(), 1);
        done = number < (Math.pow(16, loopCounter + 1 ) );
        loopCounter++;
    }
    return str;
}

module.exports = generate;


/***/ }),
/* 203 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var crypto = typeof window === 'object' && (window.crypto || window.msCrypto); // IE 11 uses window.msCrypto

var randomByte;

if (!crypto || !crypto.getRandomValues) {
    randomByte = function(size) {
        var bytes = [];
        for (var i = 0; i < size; i++) {
            bytes.push(Math.floor(Math.random() * 256));
        }
        return bytes;
    };
} else {
    randomByte = function(size) {
        return crypto.getRandomValues(new Uint8Array(size));
    };
}

module.exports = randomByte;


/***/ }),
/* 204 */
/***/ (function(module, exports) {

module.exports = function (random, alphabet, size) {
  var mask = (2 << Math.log(alphabet.length - 1) / Math.LN2) - 1
  var step = Math.ceil(1.6 * mask * size / alphabet.length)
  var id = ''

  while (true) {
    var i = step
    var bytes = random(i)
    while (i--) {
      id += alphabet[bytes[i] & mask] || ''
      if (id.length === +size) return id
    }
  }
}


/***/ }),
/* 205 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var alphabet = __webpack_require__(16);

function isShortId(id) {
    if (!id || typeof id !== 'string' || id.length < 6 ) {
        return false;
    }

    var nonAlphabetic = new RegExp('[^' +
      alphabet.get().replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&') +
    ']');
    return !nonAlphabetic.test(id);
}

module.exports = isShortId;


/***/ }),
/* 206 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = 0;


/***/ }),
/* 207 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class BookmarkStartAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            id: "w:id",
            name: "w:name",
        };
    }
}
exports.BookmarkStartAttributes = BookmarkStartAttributes;
class BookmarkEndAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            id: "w:id",
        };
    }
}
exports.BookmarkEndAttributes = BookmarkEndAttributes;


/***/ }),
/* 208 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class OutlineLevel extends xml_components_1.XmlComponent {
    constructor(level) {
        super("w:outlineLvl");
        this.level = level;
        this.root.push(new xml_components_1.Attributes({
            val: level,
        }));
    }
}
exports.OutlineLevel = OutlineLevel;


/***/ }),
/* 209 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class Bidirectional extends xml_components_1.XmlComponent {
    constructor() {
        super("w:bidi");
    }
}
exports.Bidirectional = Bidirectional;


/***/ }),
/* 210 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(211));
__export(__webpack_require__(8));
__export(__webpack_require__(82));
__export(__webpack_require__(36));
__export(__webpack_require__(226));


/***/ }),
/* 211 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const grid_1 = __webpack_require__(212);
const table_cell_1 = __webpack_require__(8);
const table_properties_1 = __webpack_require__(82);
class Table extends xml_components_1.XmlComponent {
    constructor({ rows, width, columnWidths = Array(Math.max(...rows.map((row) => row.CellCount))).fill(100), margins: { marginUnitType, top, bottom, right, left } = { marginUnitType: table_cell_1.WidthType.AUTO, top: 0, bottom: 0, right: 0, left: 0 }, float, layout, borders, alignment, }) {
        super("w:tbl");
        this.properties = new table_properties_1.TableProperties();
        this.root.push(this.properties);
        if (borders) {
            this.properties.setBorder(borders);
        }
        else {
            this.properties.setBorder({});
        }
        if (width) {
            this.properties.setWidth(width.size, width.type);
        }
        else {
            this.properties.setWidth(100);
        }
        this.properties.CellMargin.addBottomMargin(bottom || 0, marginUnitType);
        this.properties.CellMargin.addTopMargin(top || 0, marginUnitType);
        this.properties.CellMargin.addLeftMargin(left || 0, marginUnitType);
        this.properties.CellMargin.addRightMargin(right || 0, marginUnitType);
        this.root.push(new grid_1.TableGrid(columnWidths));
        for (const row of rows) {
            this.root.push(row);
        }
        rows.forEach((row, rowIndex) => {
            if (rowIndex === rows.length - 1) {
                return;
            }
            let columnIndex = 0;
            row.cells.forEach((cell) => {
                if (cell.options.rowSpan && cell.options.rowSpan > 1) {
                    const continueCell = new table_cell_1.TableCell({
                        rowSpan: cell.options.rowSpan - 1,
                        columnSpan: cell.options.columnSpan,
                        borders: cell.options.borders,
                        children: [],
                        verticalMerge: table_cell_1.VerticalMergeType.CONTINUE,
                    });
                    rows[rowIndex + 1].addCellToColumnIndex(continueCell, columnIndex);
                }
                columnIndex += cell.options.columnSpan || 1;
            });
        });
        if (float) {
            this.properties.setTableFloatProperties(float);
        }
        if (layout) {
            this.properties.setLayout(layout);
        }
        if (alignment) {
            this.properties.setAlignment(alignment);
        }
    }
}
exports.Table = Table;


/***/ }),
/* 212 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class TableGrid extends xml_components_1.XmlComponent {
    constructor(widths) {
        super("w:tblGrid");
        for (const width of widths) {
            this.root.push(new GridCol(width));
        }
    }
}
exports.TableGrid = TableGrid;
class GridColAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { w: "w:w" };
    }
}
class GridCol extends xml_components_1.XmlComponent {
    constructor(width) {
        super("w:gridCol");
        if (width !== undefined) {
            this.root.push(new GridColAttributes({ w: width }));
        }
    }
}
exports.GridCol = GridCol;


/***/ }),
/* 213 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const paragraph_1 = __webpack_require__(1);
const xml_components_1 = __webpack_require__(0);
const table_cell_components_1 = __webpack_require__(35);
const table_cell_properties_1 = __webpack_require__(214);
class TableCell extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:tc");
        this.options = options;
        this.properties = new table_cell_properties_1.TableCellProperties();
        this.root.push(this.properties);
        for (const child of options.children) {
            this.root.push(child);
        }
        if (options.verticalAlign) {
            this.properties.setVerticalAlign(options.verticalAlign);
        }
        if (options.textDirection) {
            this.properties.setTextDirection(options.textDirection);
        }
        if (options.verticalMerge) {
            this.properties.addVerticalMerge(options.verticalMerge);
        }
        else if (options.rowSpan && options.rowSpan > 1) {
            this.properties.addVerticalMerge(table_cell_components_1.VerticalMergeType.RESTART);
        }
        if (options.margins) {
            this.properties.addMargins(options.margins);
        }
        if (options.shading) {
            this.properties.setShading(options.shading);
        }
        if (options.columnSpan) {
            this.properties.addGridSpan(options.columnSpan);
        }
        if (options.width) {
            this.properties.setWidth(options.width.size, options.width.type);
        }
        if (options.borders) {
            if (options.borders.top) {
                this.properties.Borders.addTopBorder(options.borders.top.style, options.borders.top.size, options.borders.top.color);
            }
            if (options.borders.bottom) {
                this.properties.Borders.addBottomBorder(options.borders.bottom.style, options.borders.bottom.size, options.borders.bottom.color);
            }
            if (options.borders.left) {
                this.properties.Borders.addLeftBorder(options.borders.left.style, options.borders.left.size, options.borders.left.color);
            }
            if (options.borders.right) {
                this.properties.Borders.addRightBorder(options.borders.right.style, options.borders.right.size, options.borders.right.color);
            }
        }
    }
    prepForXml(file) {
        if (!(this.root[this.root.length - 1] instanceof paragraph_1.Paragraph)) {
            this.root.push(new paragraph_1.Paragraph({}));
        }
        return super.prepForXml(file);
    }
}
exports.TableCell = TableCell;


/***/ }),
/* 214 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const shading_1 = __webpack_require__(36);
const table_cell_margins_1 = __webpack_require__(216);
const table_cell_components_1 = __webpack_require__(35);
class TableCellProperties extends xml_components_1.IgnoreIfEmptyXmlComponent {
    constructor() {
        super("w:tcPr");
        this.cellBorder = new table_cell_components_1.TableCellBorders();
        this.root.push(this.cellBorder);
    }
    get Borders() {
        return this.cellBorder;
    }
    addGridSpan(cellSpan) {
        this.root.push(new table_cell_components_1.GridSpan(cellSpan));
        return this;
    }
    addVerticalMerge(type) {
        this.root.push(new table_cell_components_1.VerticalMerge(type));
        return this;
    }
    setVerticalAlign(type) {
        this.root.push(new table_cell_components_1.VAlign(type));
        return this;
    }
    setWidth(width, type = table_cell_components_1.WidthType.AUTO) {
        this.root.push(new table_cell_components_1.TableCellWidth(width, type));
        return this;
    }
    setShading(attrs) {
        this.root.push(new shading_1.TableShading(attrs));
        return this;
    }
    addMargins(options) {
        this.root.push(new table_cell_margins_1.TableCellMargin(options));
        return this;
    }
    setTextDirection(type) {
        this.root.push(new table_cell_components_1.TDirection(type));
        return this;
    }
}
exports.TableCellProperties = TableCellProperties;


/***/ }),
/* 215 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class TableShadingAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            fill: "w:fill",
            color: "w:color",
            val: "w:val",
        };
    }
}
class TableShading extends xml_components_1.XmlComponent {
    constructor(attrs) {
        super("w:shd");
        this.root.push(new TableShadingAttributes(attrs));
    }
}
exports.TableShading = TableShading;
var ShadingType;
(function (ShadingType) {
    ShadingType["CLEAR"] = "clear";
    ShadingType["DIAGONAL_CROSS"] = "diagCross";
    ShadingType["DIAGONAL_STRIPE"] = "diagStripe";
    ShadingType["HORIZONTAL_CROSS"] = "horzCross";
    ShadingType["HORIZONTAL_STRIPE"] = "horzStripe";
    ShadingType["NIL"] = "nil";
    ShadingType["PERCENT_5"] = "pct5";
    ShadingType["PERCENT_10"] = "pct10";
    ShadingType["PERCENT_12"] = "pct12";
    ShadingType["PERCENT_15"] = "pct15";
    ShadingType["PERCENT_20"] = "pct20";
    ShadingType["PERCENT_25"] = "pct25";
    ShadingType["PERCENT_30"] = "pct30";
    ShadingType["PERCENT_35"] = "pct35";
    ShadingType["PERCENT_37"] = "pct37";
    ShadingType["PERCENT_40"] = "pct40";
    ShadingType["PERCENT_45"] = "pct45";
    ShadingType["PERCENT_50"] = "pct50";
    ShadingType["PERCENT_55"] = "pct55";
    ShadingType["PERCENT_60"] = "pct60";
    ShadingType["PERCENT_62"] = "pct62";
    ShadingType["PERCENT_65"] = "pct65";
    ShadingType["PERCENT_70"] = "pct70";
    ShadingType["PERCENT_75"] = "pct75";
    ShadingType["PERCENT_80"] = "pct80";
    ShadingType["PERCENT_85"] = "pct85";
    ShadingType["PERCENT_87"] = "pct87";
    ShadingType["PERCENT_90"] = "pct90";
    ShadingType["PERCENT_95"] = "pct95";
    ShadingType["REVERSE_DIAGONAL_STRIPE"] = "reverseDiagStripe";
    ShadingType["SOLID"] = "solid";
    ShadingType["THIN_DIAGONAL_CROSS"] = "thinDiagCross";
    ShadingType["THIN_DIAGONAL_STRIPE"] = "thinDiagStripe";
    ShadingType["THIN_HORIZONTAL_CROSS"] = "thinHorzCross";
    ShadingType["THIN_REVERSE_DIAGONAL_STRIPE"] = "thinReverseDiagStripe";
    ShadingType["THIN_VERTICAL_STRIPE"] = "thinVertStripe";
    ShadingType["VERTICAL_STRIPE"] = "vertStripe";
})(ShadingType = exports.ShadingType || (exports.ShadingType = {}));


/***/ }),
/* 216 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const cell_margin_1 = __webpack_require__(217);
class TableCellMargin extends xml_components_1.XmlComponent {
    constructor({ top = 0, left = 0, right = 0, bottom = 0 }) {
        super("w:tcMar");
        this.root.push(new cell_margin_1.TopCellMargin(top));
        this.root.push(new cell_margin_1.BottomCellMargin(bottom));
        this.root.push(new cell_margin_1.RightCellMargin(right));
        this.root.push(new cell_margin_1.LeftCellMargin(left));
    }
}
exports.TableCellMargin = TableCellMargin;


/***/ }),
/* 217 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class CellMarginAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { width: "w:w", type: "w:type" };
    }
}
class TopCellMargin extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:top");
        this.root.push(new CellMarginAttributes({
            width: value,
            type: "dxa",
        }));
    }
}
exports.TopCellMargin = TopCellMargin;
class BottomCellMargin extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:bottom");
        this.root.push(new CellMarginAttributes({
            width: value,
            type: "dxa",
        }));
    }
}
exports.BottomCellMargin = BottomCellMargin;
class LeftCellMargin extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:start");
        this.root.push(new CellMarginAttributes({
            width: value,
            type: "dxa",
        }));
    }
}
exports.LeftCellMargin = LeftCellMargin;
class RightCellMargin extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:end");
        this.root.push(new CellMarginAttributes({
            width: value,
            type: "dxa",
        }));
    }
}
exports.RightCellMargin = RightCellMargin;


/***/ }),
/* 218 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const paragraph_1 = __webpack_require__(1);
const shading_1 = __webpack_require__(36);
const table_cell_1 = __webpack_require__(8);
const table_borders_1 = __webpack_require__(83);
const table_cell_margin_1 = __webpack_require__(224);
const table_float_properties_1 = __webpack_require__(88);
const table_layout_1 = __webpack_require__(90);
const table_width_1 = __webpack_require__(225);
class TableProperties extends xml_components_1.IgnoreIfEmptyXmlComponent {
    constructor() {
        super("w:tblPr");
        this.cellMargin = new table_cell_margin_1.TableCellMargin();
        this.root.push(this.cellMargin);
    }
    setWidth(width, type = table_cell_1.WidthType.AUTO) {
        this.root.push(new table_width_1.PreferredTableWidth(type, width));
        return this;
    }
    setLayout(type) {
        this.root.push(new table_layout_1.TableLayout(type));
    }
    setBorder(borderOptions) {
        this.root.push(new table_borders_1.TableBorders(borderOptions));
        return this;
    }
    get CellMargin() {
        return this.cellMargin;
    }
    setTableFloatProperties(tableFloatOptions) {
        this.root.push(new table_float_properties_1.TableFloatProperties(tableFloatOptions));
        return this;
    }
    setShading(attrs) {
        this.root.push(new shading_1.TableShading(attrs));
        return this;
    }
    setAlignment(type) {
        this.root.push(new paragraph_1.Alignment(type));
    }
}
exports.TableProperties = TableProperties;


/***/ }),
/* 219 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const style_1 = __webpack_require__(84);
__export(__webpack_require__(221));
class Styles extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:styles");
        if (options.initialStyles) {
            this.root.push(options.initialStyles);
        }
        if (options.importedStyles) {
            for (const style of options.importedStyles) {
                this.root.push(style);
            }
        }
        if (options.paragraphStyles) {
            for (const style of options.paragraphStyles) {
                this.root.push(new style_1.ParagraphStyle(style));
            }
        }
        if (options.characterStyles) {
            for (const style of options.characterStyles) {
                this.root.push(new style_1.CharacterStyle(style));
            }
        }
    }
}
exports.Styles = Styles;


/***/ }),
/* 220 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const underline_1 = __webpack_require__(15);
const character_style_1 = __webpack_require__(40);
const paragraph_style_1 = __webpack_require__(39);
class HeadingStyle extends paragraph_style_1.ParagraphStyle {
    constructor(options) {
        super(Object.assign({}, options, { basedOn: "Normal", next: "Normal", quickFormat: true }));
    }
}
exports.HeadingStyle = HeadingStyle;
class TitleStyle extends HeadingStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "Title", name: "Title" }));
    }
}
exports.TitleStyle = TitleStyle;
class Heading1Style extends HeadingStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "Heading1", name: "Heading 1" }));
    }
}
exports.Heading1Style = Heading1Style;
class Heading2Style extends HeadingStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "Heading2", name: "Heading 2" }));
    }
}
exports.Heading2Style = Heading2Style;
class Heading3Style extends HeadingStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "Heading3", name: "Heading 3" }));
    }
}
exports.Heading3Style = Heading3Style;
class Heading4Style extends HeadingStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "Heading4", name: "Heading 4" }));
    }
}
exports.Heading4Style = Heading4Style;
class Heading5Style extends HeadingStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "Heading5", name: "Heading 5" }));
    }
}
exports.Heading5Style = Heading5Style;
class Heading6Style extends HeadingStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "Heading6", name: "Heading 6" }));
    }
}
exports.Heading6Style = Heading6Style;
class ListParagraph extends paragraph_style_1.ParagraphStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "ListParagraph", name: "List Paragraph", basedOn: "Normal", quickFormat: true }));
    }
}
exports.ListParagraph = ListParagraph;
class FootnoteText extends paragraph_style_1.ParagraphStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "FootnoteText", name: "footnote text", link: "FootnoteTextChar", basedOn: "Normal", uiPriority: 99, semiHidden: true, unhideWhenUsed: true, paragraph: {
                spacing: {
                    after: 0,
                    line: 240,
                    lineRule: "auto",
                },
            }, run: {
                size: 20,
            } }));
    }
}
exports.FootnoteText = FootnoteText;
class FootnoteReferenceStyle extends character_style_1.CharacterStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "FootnoteReference", name: "footnote reference", basedOn: "DefaultParagraphFont", semiHidden: true, run: {
                superScript: true,
            } }));
    }
}
exports.FootnoteReferenceStyle = FootnoteReferenceStyle;
class FootnoteTextChar extends character_style_1.CharacterStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "FootnoteTextChar", name: "Footnote Text Char", basedOn: "DefaultParagraphFont", link: "FootnoteText", semiHidden: true, run: {
                size: 20,
            } }));
    }
}
exports.FootnoteTextChar = FootnoteTextChar;
class HyperlinkStyle extends character_style_1.CharacterStyle {
    constructor(options) {
        super(Object.assign({}, options, { id: "Hyperlink", name: "Hyperlink", basedOn: "DefaultParagraphFont", run: {
                color: "0563C1",
                underline: {
                    type: underline_1.UnderlineType.SINGLE,
                },
            } }));
    }
}
exports.HyperlinkStyle = HyperlinkStyle;


/***/ }),
/* 221 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(222));


/***/ }),
/* 222 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var BorderStyle;
(function (BorderStyle) {
    BorderStyle["SINGLE"] = "single";
    BorderStyle["DASH_DOT_STROKED"] = "dashDotStroked";
    BorderStyle["DASHED"] = "dashed";
    BorderStyle["DASH_SMALL_GAP"] = "dashSmallGap";
    BorderStyle["DOT_DASH"] = "dotDash";
    BorderStyle["DOT_DOT_DASH"] = "dotDotDash";
    BorderStyle["DOTTED"] = "dotted";
    BorderStyle["DOUBLE"] = "double";
    BorderStyle["DOUBLE_WAVE"] = "doubleWave";
    BorderStyle["INSET"] = "inset";
    BorderStyle["NIL"] = "nil";
    BorderStyle["NONE"] = "none";
    BorderStyle["OUTSET"] = "outset";
    BorderStyle["THICK"] = "thick";
    BorderStyle["THICK_THIN_LARGE_GAP"] = "thickThinLargeGap";
    BorderStyle["THICK_THIN_MEDIUM_GAP"] = "thickThinMediumGap";
    BorderStyle["THICK_THIN_SMALL_GAP"] = "thickThinSmallGap";
    BorderStyle["THIN_THICK_LARGE_GAP"] = "thinThickLargeGap";
    BorderStyle["THIN_THICK_MEDIUM_GAP"] = "thinThickMediumGap";
    BorderStyle["THIN_THICK_SMALL_GAP"] = "thinThickSmallGap";
    BorderStyle["THIN_THICK_THIN_LARGE_GAP"] = "thinThickThinLargeGap";
    BorderStyle["THIN_THICK_THIN_MEDIUM_GAP"] = "thinThickThinMediumGap";
    BorderStyle["THIN_THICK_THIN_SMALL_GAP"] = "thinThickThinSmallGap";
    BorderStyle["THREE_D_EMBOSS"] = "threeDEmboss";
    BorderStyle["THREE_D_ENGRAVE"] = "threeDEngrave";
    BorderStyle["TRIPLE"] = "triple";
    BorderStyle["WAVE"] = "wave";
})(BorderStyle = exports.BorderStyle || (exports.BorderStyle = {}));


/***/ }),
/* 223 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const paragraph_properties_1 = __webpack_require__(86);
const run_properties_1 = __webpack_require__(87);
class DocumentDefaults extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:docDefaults");
        this.runPropertiesDefaults = new run_properties_1.RunPropertiesDefaults(options && options.run);
        this.paragraphPropertiesDefaults = new paragraph_properties_1.ParagraphPropertiesDefaults(options && options.paragraph);
        this.root.push(this.runPropertiesDefaults);
        this.root.push(this.paragraphPropertiesDefaults);
    }
}
exports.DocumentDefaults = DocumentDefaults;


/***/ }),
/* 224 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const table_cell_1 = __webpack_require__(8);
class TableCellMarginAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { value: "w:w", type: "w:type" };
    }
}
class BaseTableCellMargin extends xml_components_1.XmlComponent {
    setProperties(value, type = table_cell_1.WidthType.DXA) {
        this.root.push(new TableCellMarginAttributes({
            type: type,
            value: value,
        }));
    }
}
class TableCellMargin extends xml_components_1.IgnoreIfEmptyXmlComponent {
    constructor() {
        super("w:tblCellMar");
    }
    addTopMargin(value, type = table_cell_1.WidthType.DXA) {
        const top = new BaseTableCellMargin("w:top");
        top.setProperties(value, type);
        this.root.push(top);
    }
    addLeftMargin(value, type = table_cell_1.WidthType.DXA) {
        const left = new BaseTableCellMargin("w:left");
        left.setProperties(value, type);
        this.root.push(left);
    }
    addBottomMargin(value, type = table_cell_1.WidthType.DXA) {
        const bottom = new BaseTableCellMargin("w:bottom");
        bottom.setProperties(value, type);
        this.root.push(bottom);
    }
    addRightMargin(value, type = table_cell_1.WidthType.DXA) {
        const right = new BaseTableCellMargin("w:right");
        right.setProperties(value, type);
        this.root.push(right);
    }
}
exports.TableCellMargin = TableCellMargin;


/***/ }),
/* 225 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const table_cell_1 = __webpack_require__(8);
class TableWidthAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { type: "w:type", w: "w:w" };
    }
}
class PreferredTableWidth extends xml_components_1.XmlComponent {
    constructor(type, w) {
        super("w:tblW");
        const width = type === table_cell_1.WidthType.PERCENTAGE ? `${w}%` : w;
        this.root.push(new TableWidthAttributes({ type: type, w: width }));
    }
}
exports.PreferredTableWidth = PreferredTableWidth;


/***/ }),
/* 226 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(227));
__export(__webpack_require__(91));
__export(__webpack_require__(92));


/***/ }),
/* 227 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const table_cell_1 = __webpack_require__(8);
const table_row_properties_1 = __webpack_require__(91);
class TableRow extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:tr");
        this.options = options;
        this.properties = new table_row_properties_1.TableRowProperties();
        this.root.push(this.properties);
        for (const child of options.children) {
            this.root.push(child);
        }
        if (options.cantSplit) {
            this.properties.setCantSplit();
        }
        if (options.tableHeader) {
            this.properties.setTableHeader();
        }
        if (options.height) {
            this.properties.setHeight(options.height.height, options.height.rule);
        }
    }
    get CellCount() {
        return this.options.children.length;
    }
    get Children() {
        return this.options.children;
    }
    get cells() {
        return this.root.filter((xmlComponent) => xmlComponent instanceof table_cell_1.TableCell);
    }
    addCellToIndex(cell, index) {
        this.root.splice(index + 1, 0, cell);
    }
    addCellToColumnIndex(cell, columnIndex) {
        const rootIndex = this.columnIndexToRootIndex(columnIndex, true);
        this.addCellToIndex(cell, rootIndex - 1);
    }
    rootIndexToColumnIndex(rootIndex) {
        if (rootIndex < 1 || rootIndex >= this.root.length) {
            throw new Error(`cell 'rootIndex' should between 1 to ${this.root.length - 1}`);
        }
        let colIdx = 0;
        for (let rootIdx = 1; rootIdx < rootIndex; rootIdx++) {
            const cell = this.root[rootIdx];
            colIdx += cell.options.columnSpan || 1;
        }
        return colIdx;
    }
    columnIndexToRootIndex(columnIndex, allowEndNewCell = false) {
        if (columnIndex < 0) {
            throw new Error(`cell 'columnIndex' should not less than zero`);
        }
        let colIdx = 0;
        let rootIdx = 1;
        while (colIdx <= columnIndex) {
            if (rootIdx >= this.root.length) {
                if (allowEndNewCell) {
                    return this.root.length;
                }
                else {
                    throw new Error(`cell 'columnIndex' should not great than ${colIdx - 1}`);
                }
            }
            const cell = this.root[rootIdx];
            rootIdx += 1;
            colIdx += (cell && cell.options.columnSpan) || 1;
        }
        return rootIdx - 1;
    }
}
exports.TableRow = TableRow;


/***/ }),
/* 228 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const shortid = __webpack_require__(81);
const app_properties_1 = __webpack_require__(229);
const content_types_1 = __webpack_require__(231);
const core_properties_1 = __webpack_require__(237);
const document_1 = __webpack_require__(93);
const section_properties_1 = __webpack_require__(108);
const footer_wrapper_1 = __webpack_require__(42);
const footnotes_1 = __webpack_require__(109);
const header_1 = __webpack_require__(110);
const header_wrapper_1 = __webpack_require__(45);
const media_1 = __webpack_require__(46);
const numbering_1 = __webpack_require__(111);
const paragraph_1 = __webpack_require__(1);
const relationships_1 = __webpack_require__(43);
const relationship_1 = __webpack_require__(44);
const settings_1 = __webpack_require__(279);
const styles_1 = __webpack_require__(18);
const external_styles_factory_1 = __webpack_require__(282);
const factory_1 = __webpack_require__(283);
class File {
    constructor(options = {
        creator: "Un-named",
        revision: "1",
        lastModifiedBy: "Un-named",
    }, fileProperties = {}, sections = []) {
        this.currentRelationshipId = 1;
        this.headers = [];
        this.footers = [];
        this.hyperlinkCache = {};
        this.coreProperties = new core_properties_1.CoreProperties(options);
        this.numbering = new numbering_1.Numbering(options.numbering
            ? options.numbering
            : {
                config: [],
            });
        this.docRelationships = new relationships_1.Relationships();
        this.fileRelationships = new relationships_1.Relationships();
        this.appProperties = new app_properties_1.AppProperties();
        this.footNotes = new footnotes_1.FootNotes();
        this.contentTypes = new content_types_1.ContentTypes();
        this.document = new document_1.Document();
        this.settings = new settings_1.Settings();
        this.media = fileProperties.template && fileProperties.template.media ? fileProperties.template.media : new media_1.Media();
        if (fileProperties.template) {
            this.currentRelationshipId = fileProperties.template.currentRelationshipId + 1;
        }
        if (fileProperties.template && options.externalStyles) {
            throw Error("can not use both template and external styles");
        }
        if (fileProperties.template) {
            const stylesFactory = new external_styles_factory_1.ExternalStylesFactory();
            this.styles = stylesFactory.newInstance(fileProperties.template.styles);
        }
        else if (options.externalStyles) {
            const stylesFactory = new external_styles_factory_1.ExternalStylesFactory();
            this.styles = stylesFactory.newInstance(options.externalStyles);
        }
        else if (options.styles) {
            const stylesFactory = new factory_1.DefaultStylesFactory();
            const defaultStyles = stylesFactory.newInstance();
            this.styles = new styles_1.Styles(Object.assign({}, defaultStyles, options.styles));
        }
        else {
            const stylesFactory = new factory_1.DefaultStylesFactory();
            this.styles = new styles_1.Styles(stylesFactory.newInstance());
        }
        this.addDefaultRelationships();
        if (fileProperties.template && fileProperties.template.headers) {
            for (const templateHeader of fileProperties.template.headers) {
                this.addHeaderToDocument(templateHeader.header, templateHeader.type);
            }
        }
        if (fileProperties.template && fileProperties.template.footers) {
            for (const templateFooter of fileProperties.template.footers) {
                this.addFooterToDocument(templateFooter.footer, templateFooter.type);
            }
        }
        for (const section of sections) {
            this.document.Body.addSection(section.properties ? section.properties : {});
            for (const child of section.children) {
                if (child instanceof paragraph_1.HyperlinkRef) {
                    const hyperlink = this.hyperlinkCache[child.id];
                    this.document.add(hyperlink);
                    continue;
                }
                this.document.add(child);
            }
        }
        if (options.footnotes) {
            for (const paragraph of options.footnotes) {
                this.footNotes.createFootNote(paragraph);
            }
        }
        if (options.hyperlinks) {
            const cache = {};
            for (const key in options.hyperlinks) {
                if (!options.hyperlinks[key]) {
                    continue;
                }
                const hyperlinkRef = options.hyperlinks[key];
                const hyperlink = hyperlinkRef.type === paragraph_1.HyperlinkType.EXTERNAL
                    ? this.createHyperlink(hyperlinkRef.link, hyperlinkRef.text)
                    : this.createInternalHyperLink(key, hyperlinkRef.text);
                cache[key] = hyperlink;
            }
            this.hyperlinkCache = cache;
        }
    }
    addSection({ headers = { default: new header_1.Header() }, footers = { default: new header_1.Header() }, margins = {}, size = {}, properties, children, }) {
        this.document.Body.addSection(Object.assign({}, properties, { headers: {
                default: headers.default ? this.createHeader(headers.default) : this.createHeader(new header_1.Header()),
                first: headers.first ? this.createHeader(headers.first) : undefined,
                even: headers.even ? this.createHeader(headers.even) : undefined,
            }, footers: {
                default: footers.default ? this.createFooter(footers.default) : this.createFooter(new header_1.Footer()),
                first: footers.first ? this.createFooter(footers.first) : undefined,
                even: footers.even ? this.createFooter(footers.even) : undefined,
            } }, margins, size));
        for (const child of children) {
            if (child instanceof paragraph_1.HyperlinkRef) {
                const hyperlink = this.hyperlinkCache[child.id];
                this.document.add(hyperlink);
                continue;
            }
            this.document.add(child);
        }
    }
    verifyUpdateFields() {
        if (this.document.getTablesOfContents().length) {
            this.settings.addUpdateFields();
        }
    }
    createHyperlink(link, text = link) {
        const hyperlink = new paragraph_1.Hyperlink(text, shortid.generate().toLowerCase());
        this.docRelationships.createRelationship(hyperlink.linkId, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", link, relationship_1.TargetModeType.EXTERNAL);
        return hyperlink;
    }
    createInternalHyperLink(anchor, text = anchor) {
        const hyperlink = new paragraph_1.Hyperlink(text, shortid.generate().toLowerCase(), anchor);
        return hyperlink;
    }
    createHeader(header) {
        const wrapper = new header_wrapper_1.HeaderWrapper(this.media, this.currentRelationshipId++);
        for (const child of header.options.children) {
            wrapper.add(child);
        }
        this.addHeaderToDocument(wrapper);
        return wrapper;
    }
    createFooter(footer) {
        const wrapper = new footer_wrapper_1.FooterWrapper(this.media, this.currentRelationshipId++);
        for (const child of footer.options.children) {
            wrapper.add(child);
        }
        this.addFooterToDocument(wrapper);
        return wrapper;
    }
    addHeaderToDocument(header, type = section_properties_1.HeaderReferenceType.DEFAULT) {
        this.headers.push({ header, type });
        this.docRelationships.createRelationship(header.Header.ReferenceId, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header", `header${this.headers.length}.xml`);
        this.contentTypes.addHeader(this.headers.length);
    }
    addFooterToDocument(footer, type = section_properties_1.FooterReferenceType.DEFAULT) {
        this.footers.push({ footer, type });
        this.docRelationships.createRelationship(footer.Footer.ReferenceId, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer", `footer${this.footers.length}.xml`);
        this.contentTypes.addFooter(this.footers.length);
    }
    addDefaultRelationships() {
        this.fileRelationships.createRelationship(1, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument", "word/document.xml");
        this.fileRelationships.createRelationship(2, "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties", "docProps/core.xml");
        this.fileRelationships.createRelationship(3, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties", "docProps/app.xml");
        this.docRelationships.createRelationship(this.currentRelationshipId++, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles", "styles.xml");
        this.docRelationships.createRelationship(this.currentRelationshipId++, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering", "numbering.xml");
        this.docRelationships.createRelationship(this.currentRelationshipId++, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes", "footnotes.xml");
        this.docRelationships.createRelationship(this.currentRelationshipId++, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings", "settings.xml");
    }
    get Document() {
        return this.document;
    }
    get Styles() {
        return this.styles;
    }
    get CoreProperties() {
        return this.coreProperties;
    }
    get Numbering() {
        return this.numbering;
    }
    get Media() {
        return this.media;
    }
    get DocumentRelationships() {
        return this.docRelationships;
    }
    get FileRelationships() {
        return this.fileRelationships;
    }
    get Headers() {
        return this.headers.map((item) => item.header);
    }
    get Footers() {
        return this.footers.map((item) => item.footer);
    }
    get ContentTypes() {
        return this.contentTypes;
    }
    get AppProperties() {
        return this.appProperties;
    }
    get FootNotes() {
        return this.footNotes;
    }
    get Settings() {
        return this.settings;
    }
    get HyperlinkCache() {
        return this.hyperlinkCache;
    }
}
exports.File = File;


/***/ }),
/* 229 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const app_properties_attributes_1 = __webpack_require__(230);
class AppProperties extends xml_components_1.XmlComponent {
    constructor() {
        super("Properties");
        this.root.push(new app_properties_attributes_1.AppPropertiesAttributes({
            xmlns: "http://schemas.openxmlformats.org/officeDocument/2006/extended-properties",
            vt: "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes",
        }));
    }
}
exports.AppProperties = AppProperties;


/***/ }),
/* 230 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class AppPropertiesAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            xmlns: "xmlns",
            vt: "xmlns:vt",
        };
    }
}
exports.AppPropertiesAttributes = AppPropertiesAttributes;


/***/ }),
/* 231 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const content_types_attributes_1 = __webpack_require__(232);
const default_1 = __webpack_require__(233);
const override_1 = __webpack_require__(235);
class ContentTypes extends xml_components_1.XmlComponent {
    constructor() {
        super("Types");
        this.root.push(new content_types_attributes_1.ContentTypeAttributes({
            xmlns: "http://schemas.openxmlformats.org/package/2006/content-types",
        }));
        this.root.push(new default_1.Default("image/png", "png"));
        this.root.push(new default_1.Default("image/jpeg", "jpeg"));
        this.root.push(new default_1.Default("image/jpeg", "jpg"));
        this.root.push(new default_1.Default("image/bmp", "bmp"));
        this.root.push(new default_1.Default("image/gif", "gif"));
        this.root.push(new default_1.Default("application/vnd.openxmlformats-package.relationships+xml", "rels"));
        this.root.push(new default_1.Default("application/xml", "xml"));
        this.root.push(new override_1.Override("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml", "/word/document.xml"));
        this.root.push(new override_1.Override("application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml", "/word/styles.xml"));
        this.root.push(new override_1.Override("application/vnd.openxmlformats-package.core-properties+xml", "/docProps/core.xml"));
        this.root.push(new override_1.Override("application/vnd.openxmlformats-officedocument.extended-properties+xml", "/docProps/app.xml"));
        this.root.push(new override_1.Override("application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml", "/word/numbering.xml"));
        this.root.push(new override_1.Override("application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml", "/word/footnotes.xml"));
        this.root.push(new override_1.Override("application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml", "/word/settings.xml"));
    }
    addFooter(index) {
        this.root.push(new override_1.Override("application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml", `/word/footer${index}.xml`));
    }
    addHeader(index) {
        this.root.push(new override_1.Override("application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml", `/word/header${index}.xml`));
    }
}
exports.ContentTypes = ContentTypes;


/***/ }),
/* 232 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class ContentTypeAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            xmlns: "xmlns",
        };
    }
}
exports.ContentTypeAttributes = ContentTypeAttributes;


/***/ }),
/* 233 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const default_attributes_1 = __webpack_require__(234);
class Default extends xml_components_1.XmlComponent {
    constructor(contentType, extension) {
        super("Default");
        this.root.push(new default_attributes_1.DefaultAttributes({
            contentType: contentType,
            extension: extension,
        }));
    }
}
exports.Default = Default;


/***/ }),
/* 234 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class DefaultAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            contentType: "ContentType",
            extension: "Extension",
        };
    }
}
exports.DefaultAttributes = DefaultAttributes;


/***/ }),
/* 235 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const override_attributes_1 = __webpack_require__(236);
class Override extends xml_components_1.XmlComponent {
    constructor(contentType, partName) {
        super("Override");
        this.root.push(new override_attributes_1.OverrideAttributes({
            contentType: contentType,
            partName: partName,
        }));
    }
}
exports.Override = Override;


/***/ }),
/* 236 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class OverrideAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            contentType: "ContentType",
            partName: "PartName",
        };
    }
}
exports.OverrideAttributes = OverrideAttributes;


/***/ }),
/* 237 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(238));


/***/ }),
/* 238 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const document_attributes_1 = __webpack_require__(9);
const components_1 = __webpack_require__(239);
class CoreProperties extends xml_components_1.XmlComponent {
    constructor(options) {
        super("cp:coreProperties");
        this.root.push(new document_attributes_1.DocumentAttributes({
            cp: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
            dc: "http://purl.org/dc/elements/1.1/",
            dcterms: "http://purl.org/dc/terms/",
            dcmitype: "http://purl.org/dc/dcmitype/",
            xsi: "http://www.w3.org/2001/XMLSchema-instance",
        }));
        if (options.title) {
            this.root.push(new components_1.Title(options.title));
        }
        if (options.subject) {
            this.root.push(new components_1.Subject(options.subject));
        }
        if (options.creator) {
            this.root.push(new components_1.Creator(options.creator));
        }
        if (options.keywords) {
            this.root.push(new components_1.Keywords(options.keywords));
        }
        if (options.description) {
            this.root.push(new components_1.Description(options.description));
        }
        if (options.lastModifiedBy) {
            this.root.push(new components_1.LastModifiedBy(options.lastModifiedBy));
        }
        if (options.revision) {
            this.root.push(new components_1.Revision(options.revision));
        }
        this.root.push(new components_1.Created());
        this.root.push(new components_1.Modified());
    }
}
exports.CoreProperties = CoreProperties;


/***/ }),
/* 239 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const document_attributes_1 = __webpack_require__(9);
class Title extends xml_components_1.XmlComponent {
    constructor(value) {
        super("dc:title");
        this.root.push(value);
    }
}
exports.Title = Title;
class Subject extends xml_components_1.XmlComponent {
    constructor(value) {
        super("dc:subject");
        this.root.push(value);
    }
}
exports.Subject = Subject;
class Creator extends xml_components_1.XmlComponent {
    constructor(value) {
        super("dc:creator");
        this.root.push(value);
    }
}
exports.Creator = Creator;
class Keywords extends xml_components_1.XmlComponent {
    constructor(value) {
        super("cp:keywords");
        this.root.push(value);
    }
}
exports.Keywords = Keywords;
class Description extends xml_components_1.XmlComponent {
    constructor(value) {
        super("dc:description");
        this.root.push(value);
    }
}
exports.Description = Description;
class LastModifiedBy extends xml_components_1.XmlComponent {
    constructor(value) {
        super("cp:lastModifiedBy");
        this.root.push(value);
    }
}
exports.LastModifiedBy = LastModifiedBy;
class Revision extends xml_components_1.XmlComponent {
    constructor(value) {
        super("cp:revision");
        this.root.push(value);
    }
}
exports.Revision = Revision;
class DateComponent extends xml_components_1.XmlComponent {
    getCurrentDate() {
        const date = new Date();
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const day = ("0" + date.getDate()).slice(-2);
        const hours = ("0" + date.getHours()).slice(-2);
        const minutes = ("0" + date.getMinutes()).slice(-2);
        const seconds = ("0" + date.getSeconds()).slice(-2);
        return year + "-" + month + "-" + day + "T" + hours + ":" + minutes + ":" + seconds + "Z";
    }
}
exports.DateComponent = DateComponent;
class Created extends DateComponent {
    constructor() {
        super("dcterms:created");
        this.root.push(new document_attributes_1.DocumentAttributes({
            type: "dcterms:W3CDTF",
        }));
        this.root.push(this.getCurrentDate());
    }
}
exports.Created = Created;
class Modified extends DateComponent {
    constructor() {
        super("dcterms:modified");
        this.root.push(new document_attributes_1.DocumentAttributes({
            type: "dcterms:W3CDTF",
        }));
        this.root.push(this.getCurrentDate());
    }
}
exports.Modified = Modified;


/***/ }),
/* 240 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const body_1 = __webpack_require__(94);
const document_attributes_1 = __webpack_require__(9);
class Document extends xml_components_1.XmlComponent {
    constructor() {
        super("w:document");
        this.root.push(new document_attributes_1.DocumentAttributes({
            wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
            mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
            o: "urn:schemas-microsoft-com:office:office",
            r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
            m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
            v: "urn:schemas-microsoft-com:vml",
            wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
            wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
            w10: "urn:schemas-microsoft-com:office:word",
            w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            w14: "http://schemas.microsoft.com/office/word/2010/wordml",
            w15: "http://schemas.microsoft.com/office/word/2012/wordml",
            wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
            wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
            wne: "http://schemas.microsoft.com/office/word/2006/wordml",
            wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
            Ignorable: "w14 w15 wp14",
        }));
        this.body = new body_1.Body();
        this.root.push(this.body);
    }
    add(item) {
        this.body.push(item);
        return this;
    }
    get Body() {
        return this.body;
    }
    getTablesOfContents() {
        return this.body.getTablesOfContents();
    }
}
exports.Document = Document;


/***/ }),
/* 241 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const __1 = __webpack_require__(19);
const section_properties_1 = __webpack_require__(95);
class Body extends xml_components_1.XmlComponent {
    constructor() {
        super("w:body");
        this.sections = [];
    }
    addSection(options) {
        const currentSection = this.sections.pop();
        this.root.push(this.createSectionParagraph(currentSection));
        this.sections.push(new section_properties_1.SectionProperties(options));
    }
    prepForXml(file) {
        if (this.sections.length === 1) {
            this.root.splice(0, 1);
            this.root.push(this.sections.pop());
        }
        return super.prepForXml(file);
    }
    push(component) {
        this.root.push(component);
    }
    getTablesOfContents() {
        return this.root.filter((child) => child instanceof __1.TableOfContents);
    }
    createSectionParagraph(section) {
        const paragraph = new __1.Paragraph({});
        const properties = new __1.ParagraphProperties({});
        properties.push(section);
        paragraph.addChildElement(properties);
        return paragraph;
    }
}
exports.Body = Body;


/***/ }),
/* 242 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const columns_attributes_1 = __webpack_require__(243);
class Columns extends xml_components_1.XmlComponent {
    constructor(space, num) {
        super("w:cols");
        this.root.push(new columns_attributes_1.ColumnsAttributes({
            space: space,
            num: num,
        }));
    }
}
exports.Columns = Columns;


/***/ }),
/* 243 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class ColumnsAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            space: "w:space",
            num: "w:num",
        };
    }
}
exports.ColumnsAttributes = ColumnsAttributes;


/***/ }),
/* 244 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const doc_grid_attributes_1 = __webpack_require__(245);
class DocumentGrid extends xml_components_1.XmlComponent {
    constructor(linePitch) {
        super("w:docGrid");
        this.root.push(new doc_grid_attributes_1.DocGridAttributes({
            linePitch: linePitch,
        }));
    }
}
exports.DocumentGrid = DocumentGrid;


/***/ }),
/* 245 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class DocGridAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            linePitch: "w:linePitch",
        };
    }
}
exports.DocGridAttributes = DocGridAttributes;


/***/ }),
/* 246 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var LineNumberRestartFormat;
(function (LineNumberRestartFormat) {
    LineNumberRestartFormat["CONTINUOUS"] = "continuous";
    LineNumberRestartFormat["NEW_SECTION"] = "newSection";
    LineNumberRestartFormat["NEW_PAGE"] = "newPage";
})(LineNumberRestartFormat = exports.LineNumberRestartFormat || (exports.LineNumberRestartFormat = {}));
class LineNumberAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            lineNumberCountBy: "w:countBy",
            lineNumberStart: "w:start",
            lineNumberRestart: "w:restart",
            lineNumberDistance: "w:distance",
        };
    }
}
exports.LineNumberAttributes = LineNumberAttributes;
class LineNumberType extends xml_components_1.XmlComponent {
    constructor(countBy, start, restart, dist) {
        super("w:lnNumType");
        this.root.push(new LineNumberAttributes({
            lineNumberCountBy: countBy,
            lineNumberStart: start,
            lineNumberRestart: restart,
            lineNumberDistance: dist,
        }));
    }
}
exports.LineNumberType = LineNumberType;


/***/ }),
/* 247 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var PageBorderDisplay;
(function (PageBorderDisplay) {
    PageBorderDisplay["ALL_PAGES"] = "allPages";
    PageBorderDisplay["FIRST_PAGE"] = "firstPage";
    PageBorderDisplay["NOT_FIRST_PAGE"] = "notFirstPage";
})(PageBorderDisplay = exports.PageBorderDisplay || (exports.PageBorderDisplay = {}));
var PageBorderOffsetFrom;
(function (PageBorderOffsetFrom) {
    PageBorderOffsetFrom["PAGE"] = "page";
    PageBorderOffsetFrom["TEXT"] = "text";
})(PageBorderOffsetFrom = exports.PageBorderOffsetFrom || (exports.PageBorderOffsetFrom = {}));
var PageBorderZOrder;
(function (PageBorderZOrder) {
    PageBorderZOrder["BACK"] = "back";
    PageBorderZOrder["FRONT"] = "front";
})(PageBorderZOrder = exports.PageBorderZOrder || (exports.PageBorderZOrder = {}));
class PageBordeAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            style: "w:val",
            size: "w:size",
            color: "w:color",
            space: "w:space",
        };
    }
}
class PageBorder extends xml_components_1.XmlComponent {
    constructor(key, options) {
        super(key);
        this.root.push(new PageBordeAttributes(options));
    }
}
class PageBordersAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            display: "w:display",
            offsetFrom: "w:offsetFrom",
            zOrder: "w:zOrder",
        };
    }
}
class PageBorders extends xml_components_1.IgnoreIfEmptyXmlComponent {
    constructor(options) {
        super("w:pgBorders");
        if (!options) {
            return;
        }
        let pageBordersAttributes = {};
        if (options.pageBorders) {
            pageBordersAttributes = {
                display: options.pageBorders.display,
                offsetFrom: options.pageBorders.offsetFrom,
                zOrder: options.pageBorders.zOrder,
            };
        }
        this.root.push(new PageBordersAttributes(pageBordersAttributes));
        if (options.pageBorderTop) {
            this.root.push(new PageBorder("w:top", options.pageBorderTop));
        }
        if (options.pageBorderRight) {
            this.root.push(new PageBorder("w:right", options.pageBorderRight));
        }
        if (options.pageBorderBottom) {
            this.root.push(new PageBorder("w:bottom", options.pageBorderBottom));
        }
        if (options.pageBorderLeft) {
            this.root.push(new PageBorder("w:left", options.pageBorderLeft));
        }
    }
}
exports.PageBorders = PageBorders;


/***/ }),
/* 248 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const page_margin_attributes_1 = __webpack_require__(249);
class PageMargin extends xml_components_1.XmlComponent {
    constructor(top, right, bottom, left, header, footer, gutter, mirror) {
        super("w:pgMar");
        this.root.push(new page_margin_attributes_1.PageMarginAttributes({
            top: top,
            right: right,
            bottom: bottom,
            left: left,
            header: header,
            footer: footer,
            gutter: gutter,
            mirror: mirror,
        }));
    }
}
exports.PageMargin = PageMargin;


/***/ }),
/* 249 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class PageMarginAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            top: "w:top",
            right: "w:right",
            bottom: "w:bottom",
            left: "w:left",
            header: "w:header",
            footer: "w:footer",
            gutter: "w:gutter",
            mirror: "w:mirrorMargins",
        };
    }
}
exports.PageMarginAttributes = PageMarginAttributes;


/***/ }),
/* 250 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
var PageNumberFormat;
(function (PageNumberFormat) {
    PageNumberFormat["CARDINAL_TEXT"] = "cardinalText";
    PageNumberFormat["DECIMAL"] = "decimal";
    PageNumberFormat["DECIMAL_ENCLOSED_CIRCLE"] = "decimalEnclosedCircle";
    PageNumberFormat["DECIMAL_ENCLOSED_FULL_STOP"] = "decimalEnclosedFullstop";
    PageNumberFormat["DECIMAL_ENCLOSED_PAREN"] = "decimalEnclosedParen";
    PageNumberFormat["DECIMAL_ZERO"] = "decimalZero";
    PageNumberFormat["LOWER_LETTER"] = "lowerLetter";
    PageNumberFormat["LOWER_ROMAN"] = "lowerRoman";
    PageNumberFormat["NONE"] = "none";
    PageNumberFormat["ORDINAL_TEXT"] = "ordinalText";
    PageNumberFormat["UPPER_LETTER"] = "upperLetter";
    PageNumberFormat["UPPER_ROMAN"] = "upperRoman";
    PageNumberFormat["DECIMAL_FULL_WIDTH"] = "decimalFullWidth";
})(PageNumberFormat = exports.PageNumberFormat || (exports.PageNumberFormat = {}));
class PageNumberTypeAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            pageNumberStart: "w:start",
            pageNumberFormatType: "w:fmt",
        };
    }
}
exports.PageNumberTypeAttributes = PageNumberTypeAttributes;
class PageNumberType extends xml_components_1.XmlComponent {
    constructor(start, numberFormat) {
        super("w:pgNumType");
        this.root.push(new PageNumberTypeAttributes({
            pageNumberStart: start,
            pageNumberFormatType: numberFormat,
        }));
    }
}
exports.PageNumberType = PageNumberType;


/***/ }),
/* 251 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const title_page_attributes_1 = __webpack_require__(252);
class TitlePage extends xml_components_1.XmlComponent {
    constructor() {
        super("w:titlePg");
        this.root.push(new title_page_attributes_1.TitlePageAttributes({
            value: "1",
        }));
    }
}
exports.TitlePage = TitlePage;


/***/ }),
/* 252 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class TitlePageAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            value: "w:val",
        };
    }
}
exports.TitlePageAttributes = TitlePageAttributes;


/***/ }),
/* 253 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const vertical_align_attributes_1 = __webpack_require__(107);
var SectionVerticalAlignValue;
(function (SectionVerticalAlignValue) {
    SectionVerticalAlignValue["BOTH"] = "both";
    SectionVerticalAlignValue["BOTTOM"] = "bottom";
    SectionVerticalAlignValue["CENTER"] = "center";
    SectionVerticalAlignValue["TOP"] = "top";
})(SectionVerticalAlignValue = exports.SectionVerticalAlignValue || (exports.SectionVerticalAlignValue = {}));
class SectionVerticalAlign extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:vAlign");
        this.root.push(new vertical_align_attributes_1.SectionVerticalAlignAttributes({ verticalAlign: value }));
    }
}
exports.SectionVerticalAlign = SectionVerticalAlign;


/***/ }),
/* 254 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(105));
__export(__webpack_require__(41));


/***/ }),
/* 255 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const footer_attributes_1 = __webpack_require__(256);
class Footer extends xml_components_1.InitializableXmlComponent {
    constructor(referenceNumber, initContent) {
        super("w:ftr", initContent);
        this.refId = referenceNumber;
        if (!initContent) {
            this.root.push(new footer_attributes_1.FooterAttributes({
                wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
                o: "urn:schemas-microsoft-com:office:office",
                r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
                v: "urn:schemas-microsoft-com:vml",
                wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                w10: "urn:schemas-microsoft-com:office:word",
                w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                w14: "http://schemas.microsoft.com/office/word/2010/wordml",
                w15: "http://schemas.microsoft.com/office/word/2012/wordml",
                wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                wne: "http://schemas.microsoft.com/office/word/2006/wordml",
                wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
            }));
        }
    }
    get ReferenceId() {
        return this.refId;
    }
    add(item) {
        this.root.push(item);
    }
}
exports.Footer = Footer;


/***/ }),
/* 256 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class FooterAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            wpc: "xmlns:wpc",
            mc: "xmlns:mc",
            o: "xmlns:o",
            r: "xmlns:r",
            m: "xmlns:m",
            v: "xmlns:v",
            wp14: "xmlns:wp14",
            wp: "xmlns:wp",
            w10: "xmlns:w10",
            w: "xmlns:w",
            w14: "xmlns:w14",
            w15: "xmlns:w15",
            wpg: "xmlns:wpg",
            wpi: "xmlns:wpi",
            wne: "xmlns:wne",
            wps: "xmlns:wps",
            cp: "xmlns:cp",
            dc: "xmlns:dc",
            dcterms: "xmlns:dcterms",
            dcmitype: "xmlns:dcmitype",
            xsi: "xmlns:xsi",
            type: "xsi:type",
        };
    }
}
exports.FooterAttributes = FooterAttributes;


/***/ }),
/* 257 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const attributes_1 = __webpack_require__(258);
const relationship_1 = __webpack_require__(44);
class Relationships extends xml_components_1.XmlComponent {
    constructor() {
        super("Relationships");
        this.root.push(new attributes_1.RelationshipsAttributes({
            xmlns: "http://schemas.openxmlformats.org/package/2006/relationships",
        }));
    }
    addRelationship(relationship) {
        this.root.push(relationship);
    }
    createRelationship(id, type, target, targetMode) {
        const relationship = new relationship_1.Relationship(`rId${id}`, type, target, targetMode);
        this.addRelationship(relationship);
        return relationship;
    }
    get RelationshipCount() {
        return this.root.length - 1;
    }
}
exports.Relationships = Relationships;


/***/ }),
/* 258 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class RelationshipsAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            xmlns: "xmlns",
        };
    }
}
exports.RelationshipsAttributes = RelationshipsAttributes;


/***/ }),
/* 259 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class RelationshipAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            id: "Id",
            type: "Type",
            target: "Target",
            targetMode: "TargetMode",
        };
    }
}
exports.RelationshipAttributes = RelationshipAttributes;


/***/ }),
/* 260 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const paragraph_1 = __webpack_require__(1);
const footnote_1 = __webpack_require__(261);
const continuation_seperator_run_1 = __webpack_require__(265);
const seperator_run_1 = __webpack_require__(267);
const footnotes_attributes_1 = __webpack_require__(269);
class FootNotes extends xml_components_1.XmlComponent {
    constructor() {
        super("w:footnotes");
        this.currentId = 1;
        this.root.push(new footnotes_attributes_1.FootnotesAttributes({
            wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
            mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
            o: "urn:schemas-microsoft-com:office:office",
            r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
            m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
            v: "urn:schemas-microsoft-com:vml",
            wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
            wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
            w10: "urn:schemas-microsoft-com:office:word",
            w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            w14: "http://schemas.microsoft.com/office/word/2010/wordml",
            w15: "http://schemas.microsoft.com/office/word/2012/wordml",
            wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
            wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
            wne: "http://schemas.microsoft.com/office/word/2006/wordml",
            wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
            Ignorable: "w14 w15 wp14",
        }));
        const begin = new footnote_1.Footnote(-1, footnote_1.FootnoteType.SEPERATOR);
        begin.add(new paragraph_1.Paragraph({
            spacing: {
                after: 0,
                line: 240,
                lineRule: "auto",
            },
            children: [new seperator_run_1.SeperatorRun()],
        }));
        this.root.push(begin);
        const spacing = new footnote_1.Footnote(0, footnote_1.FootnoteType.CONTINUATION_SEPERATOR);
        spacing.add(new paragraph_1.Paragraph({
            spacing: {
                after: 0,
                line: 240,
                lineRule: "auto",
            },
            children: [new continuation_seperator_run_1.ContinuationSeperatorRun()],
        }));
        this.root.push(spacing);
    }
    createFootNote(paragraph) {
        const footnote = new footnote_1.Footnote(this.currentId);
        footnote.add(paragraph);
        this.root.push(footnote);
        this.currentId++;
    }
}
exports.FootNotes = FootNotes;


/***/ }),
/* 261 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const footnote_attributes_1 = __webpack_require__(262);
const footnote_ref_run_1 = __webpack_require__(263);
var FootnoteType;
(function (FootnoteType) {
    FootnoteType["SEPERATOR"] = "separator";
    FootnoteType["CONTINUATION_SEPERATOR"] = "continuationSeparator";
})(FootnoteType = exports.FootnoteType || (exports.FootnoteType = {}));
class Footnote extends xml_components_1.XmlComponent {
    constructor(id, type) {
        super("w:footnote");
        this.root.push(new footnote_attributes_1.FootnoteAttributes({
            type: type,
            id: id,
        }));
    }
    add(paragraph) {
        paragraph.addRunToFront(new footnote_ref_run_1.FootnoteRefRun());
        this.root.push(paragraph);
    }
}
exports.Footnote = Footnote;


/***/ }),
/* 262 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class FootnoteAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            type: "w:type",
            id: "w:id",
        };
    }
}
exports.FootnoteAttributes = FootnoteAttributes;


/***/ }),
/* 263 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const paragraph_1 = __webpack_require__(1);
const footnote_ref_1 = __webpack_require__(264);
class FootnoteRefRun extends paragraph_1.Run {
    constructor() {
        super({
            style: "FootnoteReference",
        });
        this.root.push(new footnote_ref_1.FootnoteRef());
    }
}
exports.FootnoteRefRun = FootnoteRefRun;


/***/ }),
/* 264 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class FootnoteRef extends xml_components_1.XmlComponent {
    constructor() {
        super("w:footnoteRef");
    }
}
exports.FootnoteRef = FootnoteRef;


/***/ }),
/* 265 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const paragraph_1 = __webpack_require__(1);
const continuation_seperator_1 = __webpack_require__(266);
class ContinuationSeperatorRun extends paragraph_1.Run {
    constructor() {
        super({});
        this.root.push(new continuation_seperator_1.ContinuationSeperator());
    }
}
exports.ContinuationSeperatorRun = ContinuationSeperatorRun;


/***/ }),
/* 266 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class ContinuationSeperator extends xml_components_1.XmlComponent {
    constructor() {
        super("w:continuationSeparator");
    }
}
exports.ContinuationSeperator = ContinuationSeperator;


/***/ }),
/* 267 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const paragraph_1 = __webpack_require__(1);
const seperator_1 = __webpack_require__(268);
class SeperatorRun extends paragraph_1.Run {
    constructor() {
        super({});
        this.root.push(new seperator_1.Seperator());
    }
}
exports.SeperatorRun = SeperatorRun;


/***/ }),
/* 268 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class Seperator extends xml_components_1.XmlComponent {
    constructor() {
        super("w:separator");
    }
}
exports.Seperator = Seperator;


/***/ }),
/* 269 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class FootnotesAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            wpc: "xmlns:wpc",
            mc: "xmlns:mc",
            o: "xmlns:o",
            r: "xmlns:r",
            m: "xmlns:m",
            v: "xmlns:v",
            wp14: "xmlns:wp14",
            wp: "xmlns:wp",
            w10: "xmlns:w10",
            w: "xmlns:w",
            w14: "xmlns:w14",
            w15: "xmlns:w15",
            wpg: "xmlns:wpg",
            wpi: "xmlns:wpi",
            wne: "xmlns:wne",
            wps: "xmlns:wps",
            Ignorable: "mc:Ignorable",
        };
    }
}
exports.FootnotesAttributes = FootnotesAttributes;


/***/ }),
/* 270 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(271));


/***/ }),
/* 271 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(272));


/***/ }),
/* 272 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const run_1 = __webpack_require__(2);
const style_1 = __webpack_require__(65);
const xml_components_1 = __webpack_require__(0);
class FootNoteReferenceRunAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            id: "w:id",
        };
    }
}
exports.FootNoteReferenceRunAttributes = FootNoteReferenceRunAttributes;
class FootnoteReference extends xml_components_1.XmlComponent {
    constructor(id) {
        super("w:footnoteReference");
        this.root.push(new FootNoteReferenceRunAttributes({
            id: id,
        }));
    }
}
exports.FootnoteReference = FootnoteReference;
class FootnoteReferenceRun extends run_1.Run {
    constructor(id) {
        super({});
        this.properties.push(new style_1.Style("FootnoteReference"));
        this.root.push(new FootnoteReference(id));
    }
}
exports.FootnoteReferenceRun = FootnoteReferenceRun;


/***/ }),
/* 273 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const header_attributes_1 = __webpack_require__(274);
class Header extends xml_components_1.InitializableXmlComponent {
    constructor(referenceNumber, initContent) {
        super("w:hdr", initContent);
        this.refId = referenceNumber;
        if (!initContent) {
            this.root.push(new header_attributes_1.HeaderAttributes({
                wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
                o: "urn:schemas-microsoft-com:office:office",
                r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
                v: "urn:schemas-microsoft-com:vml",
                wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                w10: "urn:schemas-microsoft-com:office:word",
                w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                w14: "http://schemas.microsoft.com/office/word/2010/wordml",
                w15: "http://schemas.microsoft.com/office/word/2012/wordml",
                wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                wne: "http://schemas.microsoft.com/office/word/2006/wordml",
                wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                cx: "http://schemas.microsoft.com/office/drawing/2014/chartex",
                cx1: "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex",
                cx2: "http://schemas.microsoft.com/office/drawing/2015/10/21/chartex",
                cx3: "http://schemas.microsoft.com/office/drawing/2016/5/9/chartex",
                cx4: "http://schemas.microsoft.com/office/drawing/2016/5/10/chartex",
                cx5: "http://schemas.microsoft.com/office/drawing/2016/5/11/chartex",
                cx6: "http://schemas.microsoft.com/office/drawing/2016/5/12/chartex",
                cx7: "http://schemas.microsoft.com/office/drawing/2016/5/13/chartex",
                cx8: "http://schemas.microsoft.com/office/drawing/2016/5/14/chartex",
                w16cid: "http://schemas.microsoft.com/office/word/2016/wordml/cid",
                w16se: "http://schemas.microsoft.com/office/word/2015/wordml/symex",
            }));
        }
    }
    get ReferenceId() {
        return this.refId;
    }
    add(item) {
        this.root.push(item);
    }
}
exports.Header = Header;


/***/ }),
/* 274 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class HeaderAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            wpc: "xmlns:wpc",
            mc: "xmlns:mc",
            o: "xmlns:o",
            r: "xmlns:r",
            m: "xmlns:m",
            v: "xmlns:v",
            wp14: "xmlns:wp14",
            wp: "xmlns:wp",
            w10: "xmlns:w10",
            w: "xmlns:w",
            w14: "xmlns:w14",
            w15: "xmlns:w15",
            wpg: "xmlns:wpg",
            wpi: "xmlns:wpi",
            wne: "xmlns:wne",
            wps: "xmlns:wps",
            cp: "xmlns:cp",
            dc: "xmlns:dc",
            dcterms: "xmlns:dcterms",
            dcmitype: "xmlns:dcmitype",
            xsi: "xmlns:xsi",
            type: "xsi:type",
            cx: "xmlns:cx",
            cx1: "xmlns:cx1",
            cx2: "xmlns:cx2",
            cx3: "xmlns:cx3",
            cx4: "xmlns:cx4",
            cx5: "xmlns:cx5",
            cx6: "xmlns:cx6",
            cx7: "xmlns:cx7",
            cx8: "xmlns:cx8",
            w16cid: "xmlns:w16cid",
            w16se: "xmlns:w16se",
        };
    }
}
exports.HeaderAttributes = HeaderAttributes;


/***/ }),
/* 275 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const paragraph_1 = __webpack_require__(1);
class Media {
    static addImage(file, buffer, width, height, drawingOptions) {
        const mediaData = file.Media.addMedia(buffer, width, height);
        return new paragraph_1.PictureRun(mediaData, drawingOptions);
    }
    static generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    constructor() {
        this.map = new Map();
    }
    getMedia(key) {
        const data = this.map.get(key);
        if (data === undefined) {
            throw new Error(`Cannot find image with the key ${key}`);
        }
        return data;
    }
    addMedia(buffer, width = 100, height = 100) {
        const key = `${Media.generateId()}.png`;
        return this.createMedia(key, {
            width: width,
            height: height,
        }, buffer);
    }
    createMedia(key, dimensions, data, filePath) {
        const newData = typeof data === "string" ? this.convertDataURIToBinary(data) : data;
        const imageData = {
            stream: newData,
            path: filePath,
            fileName: key,
            dimensions: {
                pixels: {
                    x: Math.round(dimensions.width),
                    y: Math.round(dimensions.height),
                },
                emus: {
                    x: Math.round(dimensions.width * 9525),
                    y: Math.round(dimensions.height * 9525),
                },
            },
        };
        this.map.set(key, imageData);
        return imageData;
    }
    get Array() {
        const array = new Array();
        this.map.forEach((data) => {
            array.push(data);
        });
        return array;
    }
    convertDataURIToBinary(dataURI) {
        const BASE64_MARKER = ";base64,";
        const base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
        if (typeof atob === "function") {
            return new Uint8Array(atob(dataURI.substring(base64Index))
                .split("")
                .map((c) => c.charCodeAt(0)));
        }
        else {
            const b = __webpack_require__(5);
            return new b.Buffer(dataURI, "base64");
        }
    }
}
exports.Media = Media;


/***/ }),
/* 276 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKAROUND2 = "";


/***/ }),
/* 277 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const paragraph_1 = __webpack_require__(1);
const xml_components_1 = __webpack_require__(0);
const document_attributes_1 = __webpack_require__(9);
const abstract_numbering_1 = __webpack_require__(112);
const num_1 = __webpack_require__(113);
class Numbering extends xml_components_1.XmlComponent {
    constructor(options) {
        super("w:numbering");
        this.abstractNumbering = [];
        this.concreteNumbering = [];
        this.root.push(new document_attributes_1.DocumentAttributes({
            wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
            mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
            o: "urn:schemas-microsoft-com:office:office",
            r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
            m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
            v: "urn:schemas-microsoft-com:vml",
            wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
            wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
            w10: "urn:schemas-microsoft-com:office:word",
            w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            w14: "http://schemas.microsoft.com/office/word/2010/wordml",
            w15: "http://schemas.microsoft.com/office/word/2012/wordml",
            wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
            wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
            wne: "http://schemas.microsoft.com/office/word/2006/wordml",
            wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
            Ignorable: "w14 w15 wp14",
        }));
        this.nextId = 0;
        const abstractNumbering = this.createAbstractNumbering([
            {
                level: 0,
                format: "bullet",
                text: "\u25CF",
                alignment: paragraph_1.AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 720, hanging: 360 },
                    },
                },
            },
            {
                level: 1,
                format: "bullet",
                text: "\u25CB",
                alignment: paragraph_1.AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 1440, hanging: 360 },
                    },
                },
            },
            {
                level: 2,
                format: "bullet",
                text: "\u25A0",
                alignment: paragraph_1.AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 2160, hanging: 360 },
                    },
                },
            },
            {
                level: 3,
                format: "bullet",
                text: "\u25CF",
                alignment: paragraph_1.AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 2880, hanging: 360 },
                    },
                },
            },
            {
                level: 4,
                format: "bullet",
                text: "\u25CB",
                alignment: paragraph_1.AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 3600, hanging: 360 },
                    },
                },
            },
            {
                level: 5,
                format: "bullet",
                text: "\u25A0",
                alignment: paragraph_1.AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 4320, hanging: 360 },
                    },
                },
            },
            {
                level: 6,
                format: "bullet",
                text: "\u25CF",
                alignment: paragraph_1.AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 5040, hanging: 360 },
                    },
                },
            },
            {
                level: 7,
                format: "bullet",
                text: "\u25CF",
                alignment: paragraph_1.AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 5760, hanging: 360 },
                    },
                },
            },
            {
                level: 8,
                format: "bullet",
                text: "\u25CF",
                alignment: paragraph_1.AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: 6480, hanging: 360 },
                    },
                },
            },
        ]);
        this.createConcreteNumbering(abstractNumbering);
        for (const con of options.config) {
            const currentAbstractNumbering = this.createAbstractNumbering(con.levels);
            this.createConcreteNumbering(currentAbstractNumbering, con.reference);
        }
    }
    prepForXml() {
        this.abstractNumbering.forEach((x) => this.root.push(x));
        this.concreteNumbering.forEach((x) => this.root.push(x));
        return super.prepForXml();
    }
    createConcreteNumbering(abstractNumbering, reference) {
        const num = new num_1.ConcreteNumbering(this.nextId++, abstractNumbering.id, reference);
        this.concreteNumbering.push(num);
        return num;
    }
    createAbstractNumbering(options) {
        const num = new abstract_numbering_1.AbstractNumbering(this.nextId++, options);
        this.abstractNumbering.push(num);
        return num;
    }
    get ConcreteNumbering() {
        return this.concreteNumbering;
    }
}
exports.Numbering = Numbering;


/***/ }),
/* 278 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class MultiLevelType extends xml_components_1.XmlComponent {
    constructor(value) {
        super("w:multiLevelType");
        this.root.push(new xml_components_1.Attributes({
            val: value,
        }));
    }
}
exports.MultiLevelType = MultiLevelType;


/***/ }),
/* 279 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(280));
__export(__webpack_require__(114));


/***/ }),
/* 280 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const compatibility_1 = __webpack_require__(281);
const update_fields_1 = __webpack_require__(114);
class SettingsAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = {
            wpc: "xmlns:wpc",
            mc: "xmlns:mc",
            o: "xmlns:o",
            r: "xmlns:r",
            m: "xmlns:m",
            v: "xmlns:v",
            wp14: "xmlns:wp14",
            wp: "xmlns:wp",
            w10: "xmlns:w10",
            w: "xmlns:w",
            w14: "xmlns:w14",
            w15: "xmlns:w15",
            wpg: "xmlns:wpg",
            wpi: "xmlns:wpi",
            wne: "xmlns:wne",
            wps: "xmlns:wps",
            Ignorable: "mc:Ignorable",
        };
    }
}
exports.SettingsAttributes = SettingsAttributes;
class Settings extends xml_components_1.XmlComponent {
    constructor() {
        super("w:settings");
        this.root.push(new SettingsAttributes({
            wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
            mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
            o: "urn:schemas-microsoft-com:office:office",
            r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
            m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
            v: "urn:schemas-microsoft-com:vml",
            wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
            wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
            w10: "urn:schemas-microsoft-com:office:word",
            w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            w14: "http://schemas.microsoft.com/office/word/2010/wordml",
            w15: "http://schemas.microsoft.com/office/word/2012/wordml",
            wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
            wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
            wne: "http://schemas.microsoft.com/office/word/2006/wordml",
            wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
            Ignorable: "w14 w15 wp14",
        }));
        this.compatibility = new compatibility_1.Compatibility();
    }
    addUpdateFields() {
        if (!this.root.find((child) => child instanceof update_fields_1.UpdateFields)) {
            this.addChildElement(new update_fields_1.UpdateFields());
        }
    }
    addCompatibility() {
        if (!this.root.find((child) => child instanceof compatibility_1.Compatibility)) {
            this.addChildElement(this.compatibility);
        }
        return this.compatibility;
    }
}
exports.Settings = Settings;


/***/ }),
/* 281 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class DoNotExpandShiftReturn extends xml_components_1.XmlComponent {
    constructor() {
        super("w:doNotExpandShiftReturn");
    }
}
class Compatibility extends xml_components_1.XmlComponent {
    constructor() {
        super("w:compat");
    }
    doNotExpandShiftReturn() {
        this.root.push(new DoNotExpandShiftReturn());
        return this;
    }
}
exports.Compatibility = Compatibility;


/***/ }),
/* 282 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const xml_js_1 = __webpack_require__(21);
const _1 = __webpack_require__(18);
class ExternalStylesFactory {
    newInstance(xmlData) {
        const xmlObj = xml_js_1.xml2js(xmlData, { compact: false });
        let stylesXmlElement;
        for (const xmlElm of xmlObj.elements || []) {
            if (xmlElm.name === "w:styles") {
                stylesXmlElement = xmlElm;
            }
        }
        if (stylesXmlElement === undefined) {
            throw new Error("can not find styles element");
        }
        const stylesElements = stylesXmlElement.elements || [];
        const importedStyle = new _1.Styles({
            initialStyles: new xml_components_1.ImportedRootElementAttributes(stylesXmlElement.attributes),
            importedStyles: stylesElements.map((childElm) => xml_components_1.convertToXmlComponent(childElm)),
        });
        return importedStyle;
    }
}
exports.ExternalStylesFactory = ExternalStylesFactory;


/***/ }),
/* 283 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const document_attributes_1 = __webpack_require__(9);
const defaults_1 = __webpack_require__(85);
const style_1 = __webpack_require__(84);
class DefaultStylesFactory {
    newInstance() {
        const documentAttributes = new document_attributes_1.DocumentAttributes({
            mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
            r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
            w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            w14: "http://schemas.microsoft.com/office/word/2010/wordml",
            w15: "http://schemas.microsoft.com/office/word/2012/wordml",
            Ignorable: "w14 w15",
        });
        return {
            initialStyles: documentAttributes,
            importedStyles: [
                new defaults_1.DocumentDefaults(),
                new style_1.TitleStyle({
                    run: {
                        size: 56,
                    },
                }),
                new style_1.Heading1Style({
                    run: {
                        color: "2E74B5",
                        size: 32,
                    },
                }),
                new style_1.Heading2Style({
                    run: {
                        color: "2E74B5",
                        size: 26,
                    },
                }),
                new style_1.Heading3Style({
                    run: {
                        color: "1F4D78",
                        size: 24,
                    },
                }),
                new style_1.Heading4Style({
                    run: {
                        color: "2E74B5",
                        italics: true,
                    },
                }),
                new style_1.Heading5Style({
                    run: {
                        color: "2E74B5",
                    },
                }),
                new style_1.Heading6Style({
                    run: {
                        color: "1F4D78",
                    },
                }),
                new style_1.ListParagraph({}),
                new style_1.HyperlinkStyle({}),
                new style_1.FootnoteReferenceStyle({}),
                new style_1.FootnoteText({}),
                new style_1.FootnoteTextChar({}),
            ],
        };
    }
}
exports.DefaultStylesFactory = DefaultStylesFactory;


/***/ }),
/* 284 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKAROUND = "";


/***/ }),
/* 285 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(286));
__export(__webpack_require__(291));


/***/ }),
/* 286 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const paragraph_1 = __webpack_require__(1);
const run_1 = __webpack_require__(2);
const field_1 = __webpack_require__(29);
const xml_components_1 = __webpack_require__(0);
const field_instruction_1 = __webpack_require__(287);
const sdt_content_1 = __webpack_require__(288);
const sdt_properties_1 = __webpack_require__(289);
class TableOfContents extends xml_components_1.XmlComponent {
    constructor(alias = "Table of Contents", properties) {
        super("w:sdt");
        this.root.push(new sdt_properties_1.StructuredDocumentTagProperties(alias));
        const content = new sdt_content_1.StructuredDocumentTagContent();
        const beginParagraph = new paragraph_1.Paragraph({
            children: [
                new run_1.Run({
                    children: [new field_1.Begin(true), new field_instruction_1.FieldInstruction(properties), new field_1.Separate()],
                }),
            ],
        });
        content.addChildElement(beginParagraph);
        const endParagraph = new paragraph_1.Paragraph({
            children: [
                new run_1.Run({
                    children: [new field_1.End()],
                }),
            ],
        });
        content.addChildElement(endParagraph);
        this.root.push(content);
    }
}
exports.TableOfContents = TableOfContents;


/***/ }),
/* 287 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const space_type_1 = __webpack_require__(14);
const xml_components_1 = __webpack_require__(0);
class TextAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { space: "xml:space" };
    }
}
class FieldInstruction extends xml_components_1.XmlComponent {
    constructor(properties = {}) {
        super("w:instrText");
        this.properties = properties;
        this.root.push(new TextAttributes({ space: space_type_1.SpaceType.PRESERVE }));
        let instruction = "TOC";
        if (this.properties.captionLabel) {
            instruction = `${instruction} \\a "${this.properties.captionLabel}"`;
        }
        if (this.properties.entriesFromBookmark) {
            instruction = `${instruction} \\b "${this.properties.entriesFromBookmark}"`;
        }
        if (this.properties.captionLabelIncludingNumbers) {
            instruction = `${instruction} \\c "${this.properties.captionLabelIncludingNumbers}"`;
        }
        if (this.properties.sequenceAndPageNumbersSeparator) {
            instruction = `${instruction} \\d "${this.properties.sequenceAndPageNumbersSeparator}"`;
        }
        if (this.properties.tcFieldIdentifier) {
            instruction = `${instruction} \\f "${this.properties.tcFieldIdentifier}"`;
        }
        if (this.properties.hyperlink) {
            instruction = `${instruction} \\h`;
        }
        if (this.properties.tcFieldLevelRange) {
            instruction = `${instruction} \\l "${this.properties.tcFieldLevelRange}"`;
        }
        if (this.properties.pageNumbersEntryLevelsRange) {
            instruction = `${instruction} \\n "${this.properties.pageNumbersEntryLevelsRange}"`;
        }
        if (this.properties.headingStyleRange) {
            instruction = `${instruction} \\o "${this.properties.headingStyleRange}"`;
        }
        if (this.properties.entryAndPageNumberSeparator) {
            instruction = `${instruction} \\p "${this.properties.entryAndPageNumberSeparator}"`;
        }
        if (this.properties.seqFieldIdentifierForPrefix) {
            instruction = `${instruction} \\s "${this.properties.seqFieldIdentifierForPrefix}"`;
        }
        if (this.properties.stylesWithLevels && this.properties.stylesWithLevels.length) {
            const styles = this.properties.stylesWithLevels.map((sl) => `${sl.styleName},${sl.level}`).join(",");
            instruction = `${instruction} \\t "${styles}"`;
        }
        if (this.properties.useAppliedParagraphOutlineLevel) {
            instruction = `${instruction} \\u`;
        }
        if (this.properties.preserveTabInEntries) {
            instruction = `${instruction} \\w`;
        }
        if (this.properties.preserveNewLineInEntries) {
            instruction = `${instruction} \\x`;
        }
        if (this.properties.hideTabAndPageNumbersInWebView) {
            instruction = `${instruction} \\z`;
        }
        this.root.push(instruction);
    }
}
exports.FieldInstruction = FieldInstruction;


/***/ }),
/* 288 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class StructuredDocumentTagContent extends xml_components_1.XmlComponent {
    constructor() {
        super("w:sdtContent");
    }
}
exports.StructuredDocumentTagContent = StructuredDocumentTagContent;


/***/ }),
/* 289 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
const alias_1 = __webpack_require__(290);
class StructuredDocumentTagProperties extends xml_components_1.XmlComponent {
    constructor(alias) {
        super("w:sdtPr");
        this.root.push(new alias_1.Alias(alias));
    }
}
exports.StructuredDocumentTagProperties = StructuredDocumentTagProperties;


/***/ }),
/* 290 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const xml_components_1 = __webpack_require__(0);
class AliasAttributes extends xml_components_1.XmlAttributeComponent {
    constructor() {
        super(...arguments);
        this.xmlKeys = { alias: "w:val" };
    }
}
class Alias extends xml_components_1.XmlComponent {
    constructor(alias) {
        super("w:alias");
        this.root.push(new AliasAttributes({ alias }));
    }
}
exports.Alias = Alias;


/***/ }),
/* 291 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class StyleLevel {
    constructor(styleName, level) {
        this.styleName = styleName;
        this.level = level;
    }
}
exports.StyleLevel = StyleLevel;


/***/ }),
/* 292 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(293));


/***/ }),
/* 293 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const next_compiler_1 = __webpack_require__(294);
class Packer {
    static toBuffer(file, prettify) {
        return __awaiter(this, void 0, void 0, function* () {
            const zip = this.compiler.compile(file, prettify);
            const zipData = yield zip.generateAsync({
                type: "nodebuffer",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                compression: "DEFLATE",
            });
            return zipData;
        });
    }
    static toBase64String(file, prettify) {
        return __awaiter(this, void 0, void 0, function* () {
            const zip = this.compiler.compile(file, prettify);
            const zipData = yield zip.generateAsync({
                type: "base64",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                compression: "DEFLATE",
            });
            return zipData;
        });
    }
    static toBlob(file, prettify) {
        return __awaiter(this, void 0, void 0, function* () {
            const zip = this.compiler.compile(file, prettify);
            const zipData = yield zip.generateAsync({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                compression: "DEFLATE",
            });
            return zipData;
        });
    }
}
Packer.compiler = new next_compiler_1.Compiler();
exports.Packer = Packer;


/***/ }),
/* 294 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = __webpack_require__(115);
const xml = __webpack_require__(295);
const formatter_1 = __webpack_require__(297);
const image_replacer_1 = __webpack_require__(298);
const numbering_replacer_1 = __webpack_require__(299);
class Compiler {
    constructor() {
        this.formatter = new formatter_1.Formatter();
        this.imageReplacer = new image_replacer_1.ImageReplacer();
        this.numberingReplacer = new numbering_replacer_1.NumberingReplacer();
    }
    compile(file, prettifyXml) {
        const zip = new JSZip();
        const xmlifiedFileMapping = this.xmlifyFile(file, prettifyXml);
        for (const key in xmlifiedFileMapping) {
            if (!xmlifiedFileMapping[key]) {
                continue;
            }
            const obj = xmlifiedFileMapping[key];
            if (Array.isArray(obj)) {
                for (const subFile of obj) {
                    zip.file(subFile.path, subFile.data);
                }
            }
            else {
                zip.file(obj.path, obj.data);
            }
        }
        for (const data of file.Media.Array) {
            const mediaData = data.stream;
            zip.file(`word/media/${data.fileName}`, mediaData);
        }
        return zip;
    }
    xmlifyFile(file, prettify) {
        file.verifyUpdateFields();
        const documentRelationshipCount = file.DocumentRelationships.RelationshipCount + 1;
        const documentXmlData = xml(this.formatter.format(file.Document, file), prettify);
        const documentMediaDatas = this.imageReplacer.getMediaData(documentXmlData, file.Media);
        return {
            Relationships: {
                data: (() => {
                    documentMediaDatas.forEach((mediaData, i) => {
                        file.DocumentRelationships.createRelationship(documentRelationshipCount + i, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", `media/${mediaData.fileName}`);
                    });
                    return xml(this.formatter.format(file.DocumentRelationships, file), prettify);
                })(),
                path: "word/_rels/document.xml.rels",
            },
            Document: {
                data: (() => {
                    const xmlData = this.imageReplacer.replace(documentXmlData, documentMediaDatas, documentRelationshipCount);
                    const referenedXmlData = this.numberingReplacer.replace(xmlData, file.Numbering.ConcreteNumbering);
                    return referenedXmlData;
                })(),
                path: "word/document.xml",
            },
            Styles: {
                data: xml(this.formatter.format(file.Styles, file), prettify),
                path: "word/styles.xml",
            },
            Properties: {
                data: xml(this.formatter.format(file.CoreProperties, file), {
                    declaration: {
                        standalone: "yes",
                        encoding: "UTF-8",
                    },
                }),
                path: "docProps/core.xml",
            },
            Numbering: {
                data: xml(this.formatter.format(file.Numbering, file), prettify),
                path: "word/numbering.xml",
            },
            FileRelationships: {
                data: xml(this.formatter.format(file.FileRelationships, file), prettify),
                path: "_rels/.rels",
            },
            HeaderRelationships: file.Headers.map((headerWrapper, index) => {
                const xmlData = xml(this.formatter.format(headerWrapper.Header, file), prettify);
                const mediaDatas = this.imageReplacer.getMediaData(xmlData, file.Media);
                mediaDatas.forEach((mediaData, i) => {
                    headerWrapper.Relationships.createRelationship(i, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", `media/${mediaData.fileName}`);
                });
                return {
                    data: xml(this.formatter.format(headerWrapper.Relationships, file), prettify),
                    path: `word/_rels/header${index + 1}.xml.rels`,
                };
            }),
            FooterRelationships: file.Footers.map((footerWrapper, index) => {
                const xmlData = xml(this.formatter.format(footerWrapper.Footer, file), prettify);
                const mediaDatas = this.imageReplacer.getMediaData(xmlData, file.Media);
                mediaDatas.forEach((mediaData, i) => {
                    footerWrapper.Relationships.createRelationship(i, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", `media/${mediaData.fileName}`);
                });
                return {
                    data: xml(this.formatter.format(footerWrapper.Relationships, file), prettify),
                    path: `word/_rels/footer${index + 1}.xml.rels`,
                };
            }),
            Headers: file.Headers.map((headerWrapper, index) => {
                const tempXmlData = xml(this.formatter.format(headerWrapper.Header, file), prettify);
                const mediaDatas = this.imageReplacer.getMediaData(tempXmlData, file.Media);
                const xmlData = this.imageReplacer.replace(tempXmlData, mediaDatas, 0);
                return {
                    data: xmlData,
                    path: `word/header${index + 1}.xml`,
                };
            }),
            Footers: file.Footers.map((footerWrapper, index) => {
                const tempXmlData = xml(this.formatter.format(footerWrapper.Footer, file), prettify);
                const mediaDatas = this.imageReplacer.getMediaData(tempXmlData, file.Media);
                const xmlData = this.imageReplacer.replace(tempXmlData, mediaDatas, 0);
                return {
                    data: xmlData,
                    path: `word/footer${index + 1}.xml`,
                };
            }),
            ContentTypes: {
                data: xml(this.formatter.format(file.ContentTypes, file), prettify),
                path: "[Content_Types].xml",
            },
            AppProperties: {
                data: xml(this.formatter.format(file.AppProperties, file), prettify),
                path: "docProps/app.xml",
            },
            FootNotes: {
                data: xml(this.formatter.format(file.FootNotes, file), prettify),
                path: "word/footnotes.xml",
            },
            Settings: {
                data: xml(this.formatter.format(file.Settings, file), prettify),
                path: "word/settings.xml",
            },
        };
    }
}
exports.Compiler = Compiler;


/***/ }),
/* 295 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {var escapeForXML = __webpack_require__(296);
var Stream = __webpack_require__(53).Stream;

var DEFAULT_INDENT = '    ';

function xml(input, options) {

    if (typeof options !== 'object') {
        options = {
            indent: options
        };
    }

    var stream      = options.stream ? new Stream() : null,
        output      = "",
        interrupted = false,
        indent      = !options.indent ? ''
                        : options.indent === true ? DEFAULT_INDENT
                            : options.indent,
        instant     = true;


    function delay (func) {
        if (!instant) {
            func();
        } else {
            process.nextTick(func);
        }
    }

    function append (interrupt, out) {
        if (out !== undefined) {
            output += out;
        }
        if (interrupt && !interrupted) {
            stream = stream || new Stream();
            interrupted = true;
        }
        if (interrupt && interrupted) {
            var data = output;
            delay(function () { stream.emit('data', data) });
            output = "";
        }
    }

    function add (value, last) {
        format(append, resolve(value, indent, indent ? 1 : 0), last);
    }

    function end() {
        if (stream) {
            var data = output;
            delay(function () {
              stream.emit('data', data);
              stream.emit('end');
              stream.readable = false;
              stream.emit('close');
            });
        }
    }

    function addXmlDeclaration(declaration) {
        var encoding = declaration.encoding || 'UTF-8',
            attr =  { version: '1.0', encoding: encoding };

        if (declaration.standalone) {
            attr.standalone = declaration.standalone
        }

        add({'?xml': { _attr: attr } });
        output = output.replace('/>', '?>');
    }

    // disable delay delayed
    delay(function () { instant = false });

    if (options.declaration) {
        addXmlDeclaration(options.declaration);
    }

    if (input && input.forEach) {
        input.forEach(function (value, i) {
            var last;
            if (i + 1 === input.length)
                last = end;
            add(value, last);
        });
    } else {
        add(input, end);
    }

    if (stream) {
        stream.readable = true;
        return stream;
    }
    return output;
}

function element (/*input, …*/) {
    var input = Array.prototype.slice.call(arguments),
        self = {
            _elem:  resolve(input)
        };

    self.push = function (input) {
        if (!this.append) {
            throw new Error("not assigned to a parent!");
        }
        var that = this;
        var indent = this._elem.indent;
        format(this.append, resolve(
            input, indent, this._elem.icount + (indent ? 1 : 0)),
            function () { that.append(true) });
    };

    self.close = function (input) {
        if (input !== undefined) {
            this.push(input);
        }
        if (this.end) {
            this.end();
        }
    };

    return self;
}

function create_indent(character, count) {
    return (new Array(count || 0).join(character || ''))
}

function resolve(data, indent, indent_count) {
    indent_count = indent_count || 0;
    var indent_spaces = create_indent(indent, indent_count);
    var name;
    var values = data;
    var interrupt = false;

    if (typeof data === 'object') {
        var keys = Object.keys(data);
        name = keys[0];
        values = data[name];

        if (values && values._elem) {
            values._elem.name = name;
            values._elem.icount = indent_count;
            values._elem.indent = indent;
            values._elem.indents = indent_spaces;
            values._elem.interrupt = values;
            return values._elem;
        }
    }

    var attributes = [],
        content = [];

    var isStringContent;

    function get_attributes(obj){
        var keys = Object.keys(obj);
        keys.forEach(function(key){
            attributes.push(attribute(key, obj[key]));
        });
    }

    switch(typeof values) {
        case 'object':
            if (values === null) break;

            if (values._attr) {
                get_attributes(values._attr);
            }

            if (values._cdata) {
                content.push(
                    ('<![CDATA[' + values._cdata).replace(/\]\]>/g, ']]]]><![CDATA[>') + ']]>'
                );
            }

            if (values.forEach) {
                isStringContent = false;
                content.push('');
                values.forEach(function(value) {
                    if (typeof value == 'object') {
                        var _name = Object.keys(value)[0];

                        if (_name == '_attr') {
                            get_attributes(value._attr);
                        } else {
                            content.push(resolve(
                                value, indent, indent_count + 1));
                        }
                    } else {
                        //string
                        content.pop();
                        isStringContent=true;
                        content.push(escapeForXML(value));
                    }

                });
                if (!isStringContent) {
                    content.push('');
                }
            }
        break;

        default:
            //string
            content.push(escapeForXML(values));

    }

    return {
        name:       name,
        interrupt:  interrupt,
        attributes: attributes,
        content:    content,
        icount:     indent_count,
        indents:    indent_spaces,
        indent:     indent
    };
}

function format(append, elem, end) {

    if (typeof elem != 'object') {
        return append(false, elem);
    }

    var len = elem.interrupt ? 1 : elem.content.length;

    function proceed () {
        while (elem.content.length) {
            var value = elem.content.shift();

            if (value === undefined) continue;
            if (interrupt(value)) return;

            format(append, value);
        }

        append(false, (len > 1 ? elem.indents : '')
            + (elem.name ? '</' + elem.name + '>' : '')
            + (elem.indent && !end ? '\n' : ''));

        if (end) {
            end();
        }
    }

    function interrupt(value) {
       if (value.interrupt) {
           value.interrupt.append = append;
           value.interrupt.end = proceed;
           value.interrupt = false;
           append(true);
           return true;
       }
       return false;
    }

    append(false, elem.indents
        + (elem.name ? '<' + elem.name : '')
        + (elem.attributes.length ? ' ' + elem.attributes.join(' ') : '')
        + (len ? (elem.name ? '>' : '') : (elem.name ? '/>' : ''))
        + (elem.indent && len > 1 ? '\n' : ''));

    if (!len) {
        return append(false, elem.indent ? '\n' : '');
    }

    if (!interrupt(elem)) {
        proceed();
    }
}

function attribute(key, value) {
    return key + '=' + '"' + escapeForXML(value) + '"';
}

module.exports = xml;
module.exports.element = module.exports.Element = element;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ }),
/* 296 */
/***/ (function(module, exports) {


var XML_CHARACTER_MAP = {
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
    '<': '&lt;',
    '>': '&gt;'
};

function escapeForXML(string) {
    return string && string.replace
        ? string.replace(/([&"<>'])/g, function(str, item) {
            return XML_CHARACTER_MAP[item];
          })
        : string;
}

module.exports = escapeForXML;


/***/ }),
/* 297 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class Formatter {
    format(input, file) {
        const output = input.prepForXml(file);
        if (output) {
            return output;
        }
        else {
            throw Error("XMLComponent did not format correctly");
        }
    }
}
exports.Formatter = Formatter;


/***/ }),
/* 298 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class ImageReplacer {
    replace(xmlData, mediaData, offset) {
        let currentXmlData = xmlData;
        mediaData.forEach((image, i) => {
            currentXmlData = currentXmlData.replace(new RegExp(`{${image.fileName}}`, "g"), (offset + i).toString());
        });
        return currentXmlData;
    }
    getMediaData(xmlData, media) {
        return media.Array.filter((image) => xmlData.search(`{${image.fileName}}`) > 0);
    }
}
exports.ImageReplacer = ImageReplacer;


/***/ }),
/* 299 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class NumberingReplacer {
    replace(xmlData, concreteNumberings) {
        let currentXmlData = xmlData;
        for (const concreteNumbering of concreteNumberings) {
            if (!concreteNumbering.reference) {
                continue;
            }
            currentXmlData = currentXmlData.replace(new RegExp(`{${concreteNumbering.reference}}`, "g"), concreteNumbering.id.toString());
        }
        return currentXmlData;
    }
}
exports.NumberingReplacer = NumberingReplacer;


/***/ }),
/* 300 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(301));


/***/ }),
/* 301 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = __webpack_require__(115);
const xml_js_1 = __webpack_require__(21);
const footer_wrapper_1 = __webpack_require__(42);
const header_wrapper_1 = __webpack_require__(45);
const media_1 = __webpack_require__(46);
const relationship_1 = __webpack_require__(44);
const xml_components_1 = __webpack_require__(0);
const schemeToType = {
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header": "header",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer": "footer",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image": "image",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink": "hyperlink",
};
var RelationshipType;
(function (RelationshipType) {
    RelationshipType["HEADER"] = "header";
    RelationshipType["FOOTER"] = "footer";
    RelationshipType["IMAGE"] = "image";
    RelationshipType["HYPERLINK"] = "hyperlink";
})(RelationshipType || (RelationshipType = {}));
class ImportDotx {
    extract(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const zipContent = yield JSZip.loadAsync(data);
            const documentContent = yield zipContent.files["word/document.xml"].async("text");
            const relationshipContent = yield zipContent.files["word/_rels/document.xml.rels"].async("text");
            const documentRefs = this.extractDocumentRefs(documentContent);
            const documentRelationships = this.findReferenceFiles(relationshipContent);
            const media = new media_1.Media();
            const templateDocument = {
                headers: yield this.createHeaders(zipContent, documentRefs, documentRelationships, media, 0),
                footers: yield this.createFooters(zipContent, documentRefs, documentRelationships, media, documentRefs.headers.length),
                currentRelationshipId: documentRefs.footers.length + documentRefs.headers.length,
                styles: yield zipContent.files["word/styles.xml"].async("text"),
                titlePageIsDefined: this.checkIfTitlePageIsDefined(documentContent),
                media: media,
            };
            return templateDocument;
        });
    }
    createFooters(zipContent, documentRefs, documentRelationships, media, startingRelationshipId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = documentRefs.footers
                .map((reference, i) => __awaiter(this, void 0, void 0, function* () {
                const relationshipFileInfo = documentRelationships.find((rel) => rel.id === reference.id);
                if (relationshipFileInfo === null || !relationshipFileInfo) {
                    throw new Error(`Can not find target file for id ${reference.id}`);
                }
                const xmlData = yield zipContent.files[`word/${relationshipFileInfo.target}`].async("text");
                const xmlObj = xml_js_1.xml2js(xmlData, { compact: false, captureSpacesBetweenElements: true });
                if (!xmlObj.elements) {
                    return undefined;
                }
                const xmlElement = xmlObj.elements.reduce((acc, current) => (current.name === "w:ftr" ? current : acc));
                const importedComp = xml_components_1.convertToXmlComponent(xmlElement);
                const wrapper = new footer_wrapper_1.FooterWrapper(media, startingRelationshipId + i, importedComp);
                yield this.addRelationshipToWrapper(relationshipFileInfo, zipContent, wrapper, media);
                return { type: reference.type, footer: wrapper };
            }))
                .filter((x) => !!x);
            return Promise.all(result);
        });
    }
    createHeaders(zipContent, documentRefs, documentRelationships, media, startingRelationshipId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = documentRefs.headers
                .map((reference, i) => __awaiter(this, void 0, void 0, function* () {
                const relationshipFileInfo = documentRelationships.find((rel) => rel.id === reference.id);
                if (relationshipFileInfo === null || !relationshipFileInfo) {
                    throw new Error(`Can not find target file for id ${reference.id}`);
                }
                const xmlData = yield zipContent.files[`word/${relationshipFileInfo.target}`].async("text");
                const xmlObj = xml_js_1.xml2js(xmlData, { compact: false, captureSpacesBetweenElements: true });
                if (!xmlObj.elements) {
                    return undefined;
                }
                const xmlElement = xmlObj.elements.reduce((acc, current) => (current.name === "w:hdr" ? current : acc));
                const importedComp = xml_components_1.convertToXmlComponent(xmlElement);
                const wrapper = new header_wrapper_1.HeaderWrapper(media, startingRelationshipId + i, importedComp);
                yield this.addRelationshipToWrapper(relationshipFileInfo, zipContent, wrapper, media);
                return { type: reference.type, header: wrapper };
            }))
                .filter((x) => !!x);
            return Promise.all(result);
        });
    }
    addRelationshipToWrapper(relationhipFile, zipContent, wrapper, media) {
        return __awaiter(this, void 0, void 0, function* () {
            const refFile = zipContent.files[`word/_rels/${relationhipFile.target}.rels`];
            if (!refFile) {
                return;
            }
            const xmlRef = yield refFile.async("text");
            const wrapperImagesReferences = this.findReferenceFiles(xmlRef).filter((r) => r.type === RelationshipType.IMAGE);
            const hyperLinkReferences = this.findReferenceFiles(xmlRef).filter((r) => r.type === RelationshipType.HYPERLINK);
            for (const r of wrapperImagesReferences) {
                const buffer = yield zipContent.files[`word/${r.target}`].async("nodebuffer");
                const mediaData = media.addMedia(buffer);
                wrapper.Relationships.createRelationship(r.id, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", `media/${mediaData.fileName}`);
            }
            for (const r of hyperLinkReferences) {
                wrapper.Relationships.createRelationship(r.id, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", r.target, relationship_1.TargetModeType.EXTERNAL);
            }
        });
    }
    findReferenceFiles(xmlData) {
        const xmlObj = xml_js_1.xml2js(xmlData, { compact: true });
        const relationXmlArray = Array.isArray(xmlObj.Relationships.Relationship)
            ? xmlObj.Relationships.Relationship
            : [xmlObj.Relationships.Relationship];
        const relationships = relationXmlArray
            .map((item) => {
            if (item._attributes === undefined) {
                throw Error("relationship element has no attributes");
            }
            return {
                id: this.parseRefId(item._attributes.Id),
                type: schemeToType[item._attributes.Type],
                target: item._attributes.Target,
            };
        })
            .filter((item) => item.type !== null);
        return relationships;
    }
    extractDocumentRefs(xmlData) {
        const xmlObj = xml_js_1.xml2js(xmlData, { compact: true });
        const sectionProp = xmlObj["w:document"]["w:body"]["w:sectPr"];
        const headerProps = sectionProp["w:headerReference"];
        let headersXmlArray;
        if (headerProps === undefined) {
            headersXmlArray = [];
        }
        else if (Array.isArray(headerProps)) {
            headersXmlArray = headerProps;
        }
        else {
            headersXmlArray = [headerProps];
        }
        const headers = headersXmlArray.map((item) => {
            if (item._attributes === undefined) {
                throw Error("header referecne element has no attributes");
            }
            return {
                type: item._attributes["w:type"],
                id: this.parseRefId(item._attributes["r:id"]),
            };
        });
        const footerProps = sectionProp["w:footerReference"];
        let footersXmlArray;
        if (footerProps === undefined) {
            footersXmlArray = [];
        }
        else if (Array.isArray(footerProps)) {
            footersXmlArray = footerProps;
        }
        else {
            footersXmlArray = [footerProps];
        }
        const footers = footersXmlArray.map((item) => {
            if (item._attributes === undefined) {
                throw Error("footer referecne element has no attributes");
            }
            return {
                type: item._attributes["w:type"],
                id: this.parseRefId(item._attributes["r:id"]),
            };
        });
        return { headers, footers };
    }
    checkIfTitlePageIsDefined(xmlData) {
        const xmlObj = xml_js_1.xml2js(xmlData, { compact: true });
        const sectionProp = xmlObj["w:document"]["w:body"]["w:sectPr"];
        return sectionProp["w:titlePg"] !== undefined;
    }
    parseRefId(str) {
        const match = /^rId(\d+)$/.exec(str);
        if (match === null) {
            throw new Error("Invalid ref id");
        }
        return parseInt(match[1], 10);
    }
}
exports.ImportDotx = ImportDotx;


/***/ })
/******/ ]);
});
}).call(this,require("buffer").Buffer)
},{"buffer":4}],3:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],4:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)
},{"base64-js":3,"buffer":4,"ieee754":5}],5:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}]},{},[1])(1)
});
