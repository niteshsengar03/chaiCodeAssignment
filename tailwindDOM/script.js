const a = document.querySelectorAll('[class]');
console.log(a);
a.forEach(myfunction);
function myfunction(element){
    console.log(element.classList);
}