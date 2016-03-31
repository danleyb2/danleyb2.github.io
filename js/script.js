window.onload=function(){
    document.getElementById('send-message').onsubmit=sendMessage

};
getMyAge();
var f;
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
// Google Maps Scripts
// When the window has finished loading create our google map below
google.maps.event.addDomListener(window, 'load', init);
function init() {
    // Basic options for a simple Google Map
    // For more options see: https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var mapOptions = {
        // How zoomed in you want the map to start at (always required)
        zoom: 15,

        // The latitude and longitude to center the map (always required)
        center: new google.maps.LatLng(-0.6799689999999999, 35.020655),
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        // Disables the default Google Maps UI components
        disableDefaultUI: false,
        scrollwheel: false,
        draggable: false
    };

    // Get the HTML DOM element that will contain your map
    // We are using a div with id="map" seen below in the <body>
    var mapElement = document.getElementById('map');

    // Create the Google Map using out element and options defined above
    var map = new google.maps.Map(mapElement, mapOptions);

    // Custom Map Marker Icon - Customize the map-marker.png file to customize your icon
    var image = 'img/me/marker.png';
    var myLatLng = new google.maps.LatLng(-0.6799689999999999, 35.020655);
    var beachMarker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        icon: image
    });
}
