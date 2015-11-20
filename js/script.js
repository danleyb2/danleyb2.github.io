window.onload=function(){
    getMyAge();
    document.getElementById('send-message').onsubmit=sendMessage

};var f;
function getMyAge(){
    var ageMills=new Date()-new Date('1/26/1996');
    var inDays=ageMills/1000/60/60/24;  //days
    var years=inDays/365;
    var daysAY=inDays%365;
    var months=(daysAY)/30;
    var daysAM=daysAY%30;
    var days=Math.floor(daysAM);
    document.getElementById('age-years').innerHTML=Math.floor(years);
    document.getElementById('age-months').innerHTML=Math.floor(months);
    document.getElementById('age-days').innerHTML=(days>1||days==0)?days+' days.':days+' day.';
}
function sendMessage(t){
    t.preventDefault();
   mixpanel.track('message',{
        "name":t.target.name.value.trim(),
        "email":t.target.email.value.trim(),
        "message":t.target.message.value.trim()
    });
}