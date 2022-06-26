const docx = require("docx");
const fs = require("fs");

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
        },
        size:{
            width:12240,//21.59cm US Letter size
            height:15840,//27.94cm
          },
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

    // section.footer = {
    //         default: new docx.Footer({
    //             children: [
    //                 new docx.Paragraph({
    //                     alignment: AlignmentType.CENTER,
    //                     children: [
    //                         new docx.TextRun({
    //                             children: [PageNumber.CURRENT],
    //                         }),
                            
    //                     ],
    //                 }),
    //             ],
    //         }),
    //     properties: {
    //         pageNumberStart: 2,
    //         pageNumberFormatType: PageNumberFormat.DECIMAL,
    //     },
    // }

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
    

    output.push(new docx.Paragraph({ 
        children: [makeDefaultTextRun("From:"),makeDefaultTextRun("\t" + from)], 
        tabStops: [
            {
                type: docx.TabStopType.LEFT,
                position: 720,
            },
        ],
        indent: 
            {
                firstLine: "-720",
                start: ".5in",
            }
    }));
    output.push(new docx.Paragraph({ 
        children: [makeDefaultTextRun("To:"),makeDefaultTextRun("\t" + to)], 
        tabStops: [
            {
                type: docx.TabStopType.LEFT,
                position: 720,
            },
        ],
        indent: 
            {
                firstLine: "-720",
                start: ".5in",
            }
    }));

    //Add Vias
    //Check if via yes box is checked
    if (document.getElementById("rad1").checked) {
        console.log("Num vias detected: " + vias.length );
        for (i = 0; i < vias.length; i++) { //Add a via line for every via Box
            if(vias.length == 1) {//If only 1 via, no numbers
                output.push(new docx.Paragraph({ 
                    children: [
                        makeDefaultTextRun("Via:"),     
                        makeDefaultTextRun("\t" + vias[i].value)], 
                    tabStops: [
                        {
                            type: docx.TabStopType.LEFT,
                            position: 720,
                        },
                    ],
                    indent: 
                    {
                        firstLine: "-720",
                        start: ".5in",
                    }
                    }));
            }
            else if(vias.length > 1) {//2 or more vias, add numbers
                if(i == 0) { 
                    output.push(new docx.Paragraph({ 
                        children: [
                            makeDefaultTextRun("Via:"),     
                            makeDefaultTextRun("\t(" + (i+1) + ")\t" + vias[i].value)], 
                        tabStops: [
                            {
                                type: docx.TabStopType.LEFT,
                                position: 720,
                            },
                            {
                                type: docx.TabStopType.LEFT,
                                position: 1046,
                            },
                        ],
                        indent: 
                    {
                        firstLine: "-1046",
                        start: "1046",
                    }
                        }));
                } else {
                output.push(new docx.Paragraph({ children: [makeDefaultTextRun("(" + (i+1) + ")\t" + vias[i].value)], 
                tabStops: [
                    {
                        type: docx.TabStopType.LEFT,
                        position: 1046,
                    },
                ],
                    indent: {
                        firstLine: "-326",
                        start: "1046",
                    }
            }));
                }
            }
        }
    }//end vias

    //subject
    output.push(new docx.Paragraph({ text: "" }));
    output.push(new docx.Paragraph({ 
        children: [makeDefaultTextRun("Subj:"),makeDefaultTextRun("\t" + subj.toUpperCase())], 
        tabStops: [
            {
                type: docx.TabStopType.LEFT,
                position: 720,
            },
        ],
        indent: 
            {
                firstLine: "-720",
                start: ".5in",
            }
    }));
    
    //end subject
    output.push(new docx.Paragraph({ text: "" }));

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
                output.push(new docx.Paragraph({ 
                    children: [
                    makeDefaultTextRun("Ref:"), 
                    makeDefaultTextRun("\t" + outputLetterBlock + "\t" + refs[i].value)],
                    tabStops: [
                    {
                        type: docx.TabStopType.LEFT,
                        position: 720,
                    },
                    {
                        type: docx.TabStopType.LEFT,
                        position: 1046,
                    },
                ],
                indent: 
                    {
                        firstLine: "-1046",
                        start: "1046",
                    }
            }));
            } else {
            output.push(new docx.Paragraph({ children: [makeDefaultTextRun(outputLetterBlock + "\t" + refs[i].value)], 
                indent: {
                    firstLine: "-326",
                    start: "1046",
                }
        }));
            }
        }
        output.push(new docx.Paragraph({ text: "" }));
    }
    //end refs
    

    //Add enclosures
    //Check if encls  yes box is checked
    if (document.getElementById("rad5").checked) {
        console.log("Num encls detected: " + encls.length );
        for (i = 0; i < encls.length; i++) { //Add a via line for every via Box
            if(i == 0) { 
                output.push(new docx.Paragraph({ 
                    children: [makeDefaultTextRun("Encl:"), makeDefaultTextRun("\t(" + (i+1) + ")\t" + encls[i].value)],
                    tabStops: [
                        {
                            type: docx.TabStopType.LEFT,
                            position: 720,
                        },
                        {
                            type: docx.TabStopType.LEFT,
                            position: 1046,
                        },
                    ],
                    indent: 
                    {
                        firstLine: "-1046",
                        start: "1046",
                    }
                 }));
            } else {
            output.push(new docx.Paragraph({ children: [makeDefaultTextRun("(" + (i+1) + ") " + encls[i].value)], 
                indent: {
                    firstLine: "-326",
                    start: "1046",
                }
        }));
            }
        }
        output.push(new docx.Paragraph({ text: "" }));
    }
    //end enclosures

    
    
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
    const image = docx.Media.addImage(doc, fs.readFileSync("../../assets/images/DODb1.png"), 101.92, 100, {
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
    return '<textarea rows = "8" cols = "80" id="BodyBlocks" name="BodyBlocks"></textarea>' + '<br/>' +'<label for = "bodylvl"> Select the body level: </label>' + '<select id="BodyLevel" name="BodyLevel" >' + '<option SELECTED value=1>1</option>' + '<option value=2>2</option>' + '<option value=3>3</option>' + '</select>' + '<input type="button" value="Remove Paragraph" onclick = "generatorBundle.removeBody(this)" >'
}

function AddBodyTextBox() {
    var div = document.createElement('DIV');
    div.innerHTML = GetDynamicBodyTextBox("");
    document.getElementById("BodyTextBoxContainer").appendChild(div);
}

function RemoveBodyTextBox(div) {
    document.getElementById("BodyTextBoxContainer").removeChild(div.parentNode);
}
