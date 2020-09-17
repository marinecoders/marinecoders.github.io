// this is a test
function GetDynamicViaTextBox(value){
    return '<input name = "ViaTextBox" size="60" type="text" value = "' + value + '" >' +
            '<input type="button" value="Remove" onclick = "RemoveViaTextBox(this)" >'
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
function GetDynamicRefTextBox(value){
    return '<input name = "RefTextBox" size="60" type="text" value = "' + value + '" >' +
            '<input type="button" value="Remove" onclick = "RemoveRefTextBox(this)" >'
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
function GetDynamicEnclTextBox(value){
    return '<input name = "EnclTextBox" size="60" type="text" value = "' + value + '" >' +
            '<input type="button" value="Remove" onclick = "RemoveEnclTextBox(this)" >'
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
function GetDynamicCopyTextBox(value){
    return '<input name = "CopyTextBox" size="60" type="text" value = "' + value + '" >' +
            '<input type="button" value="Remove" onclick = "RemoveCopyTextBox(this)" >'
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
function GetDynamicBodyTextBox(value){
    return '<textarea rows = "8" cols = "80" id="BodyBlocks" name="BodyBlocks"> </textarea>' + '<label for = "bodylvl"> Select the body level: </label>' + '<select id="BodyLevel" name="BodyLevel" >' + '<option SELECTED value=1>1</option>' + '<option value=2>2</option>' + '<option value=3>3</option>' + '</select>' + '<input type="button" value="Remove Paragraph" onclick = "RemoveBodyTextBox(this)" >' 
}

function AddBodyTextBox() {
    var div = document.createElement('DIV');
    div.innerHTML = GetDynamicBodyTextBox("");
    document.getElementById("BodyTextBoxContainer").appendChild(div);
}

function RemoveBodyTextBox(div) {
    document.getElementById("BodyTextBoxContainer").removeChild(div.parentNode);
}

//Turn Hidden Inputs On/Off
	if(document.all && !document.getElementById) { //IE4 support
  		document.getElementById = function(id) { return document.all[id]; }
	}
	function dss_addLoadEvent(fn) {
  		if(typeof(fn)!="function")return;
  			var tempFunc=window.onload;
  			window.onload=function() {
    		if(typeof(tempFunc)=="function")tempFunc();
    			fn();
  		}
	}

	dss_addLoadEvent(function() {
  		if(!document.getElementById) return;
  		var f = document.getElementById('NLFform');
  		// hide the text area and its parent label
 		 document.getElementById('ViaTextBoxContainer').style.display = 'none';
		document.getElementById('RefTextBoxContainer').style.display = 'none';
		document.getElementById('EnclTextBoxContainer').style.display = 'none';
		document.getElementById('CopyTextBoxContainer').style.display = 'none';
  		// get a reference to the radio button group
  		var rads = f.elements['ifVia'];
  		for(var i=0;i<rads.length;i++) {
    		// we add the event handler to each button in the group
    			rads[i].onkeyup=rads[i].onclick=function(){
      			if(!this.checked) return;
      			var el = document.getElementById('ViaTextBoxContainer');
      			el.style.display = (this.value=="yes")?'':'none';
    }
    // in case, for any reason, one of the radio buttons is already checked
    rads[i].onclick();
  }

  		var rads = f.elements['ifRef'];
  		for(var i=0;i<rads.length;i++) {
    		// we add the event handler to each button in the group
    			rads[i].onkeyup=rads[i].onclick=function(){
      			if(!this.checked) return;
      			var el = document.getElementById('RefTextBoxContainer');
      			el.style.display = (this.value=="yes")?'':'none';
    }
    // in case, for any reason, one of the radio buttons is already checked
    rads[i].onclick();
  }

  		var rads = f.elements['ifEncl'];
  		for(var i=0;i<rads.length;i++) {
    		// we add the event handler to each button in the group
    			rads[i].onkeyup=rads[i].onclick=function(){
      			if(!this.checked) return;
      			var el = document.getElementById('EnclTextBoxContainer');
      			el.style.display = (this.value=="yes")?'':'none';
    }
    // in case, for any reason, one of the radio buttons is already checked
    rads[i].onclick();
  }

  		var rads = f.elements['ifCopy'];
  		for(var i=0;i<rads.length;i++) {
    		// we add the event handler to each button in the group
    			rads[i].onkeyup=rads[i].onclick=function(){
      			if(!this.checked) return;
      			var el = document.getElementById('CopyTextBoxContainer');
      			el.style.display = (this.value=="yes")?'':'none';
    }
    // in case, for any reason, one of the radio buttons is already checked
    rads[i].onclick();
  }

});