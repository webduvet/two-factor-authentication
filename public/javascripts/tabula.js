var Tabula = function(element, settings){
  var config = {};
  for (var key in settings) {
    config[key] = settings[key];
  }
  
	var innerEl = document.createElement('div');
	element.appendChild(innerEl);
	this.outer	= element;
	this.inner = innerEl;

} 

Tabula.prototype.write = function(ln){
  var newel = document.createElement("div");
  var text = document.createTextNode("> "+ln);
  newel.appendChild(text);
	this.inner.appendChild(newel);
	this.outer.scrollTop = this.outer.scrollHeight;
} 


Tabula.prototype.writeError = function(ln){
  var newel = document.createElement("div");
	newel.className = "error";
  var text = document.createTextNode("> "+ln);
  newel.appendChild(text);
	this.inner.appendChild(newel);
	this.outer.scrollTop = this.outer.scrollHeight;
} 
