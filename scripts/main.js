var mapFlightPath;
var markers = [];

/**
 * Build an object array (Contains: airport code, lat, long, and user friendly string) of all of the airports in the United States
 * Uses the SITA Airport API
 */
function getListOfAirports() {
    $.ajax({
        type: 'GET',
        url: "https://airport.api.aero/airport?user_key=a9ff64aa62119e73340ab37b56c64996",
        dataType: 'jsonp',
        success: function(data) {
            airportArr = data.airports.filter(function(airport) {
                    return airport.country === "United States"
                })
                .map(function(airport) {
                    var filtObj = {};
                    filtObj["value"] = airport.code;
                    filtObj["lat"] = airport.lat;
                    filtObj["long"] = airport.lng;
                    filtObj["label"] = airport.code + " " + airport.city + " - " + airport.name;
                    return filtObj;
                });
            bindAutoComplete();
        },
        error: function(xhr, status, err) {
            console.error("An error has occured: Status: " + status + " Error: " + err.toString());
        }
    });
}

/**
 * Bind the airport data in the airportArr to the form fields
 */
function bindAutoComplete() {
    fieldArr = ["#airport1", "#airport2"];
    for (i in fieldArr) {
        $(fieldArr[i]).autocomplete({
            source: airportArr,
            delay: 500,
            focus: function(event, ui) {
                // prevent autocomplete from updating the textbox
                event.preventDefault();
                //update the textbox
                $(this).val(ui.item.label);
            },
            select: function(event, ui) {
                $(this).removeData('airCode');
                // prevent autocomplete from updating the textbox
                event.preventDefault();
                // update the textbox and data field
                $(this).val(ui.item.label);
                $(this).data("airCode", ui.item.value);
                $(this).data("airLat", ui.item.lat);
                $(this).data("airLong", ui.item.long);
            }

        })
    }
}

/**
 * Bind any events to their respective elements
 */
function bindEventHandlers() {
    $('.submit-btn').on('click', updatePage);
}

/**
 * Update calculated distance and map elements
 */
function updatePage() {
    getDistBetweenAirports();
    setMapObjects();
}

/**
 * Calculate the distance between two airports using their airport code and display the results
 * Runs form validation before executing ajax call
 * Uses the SITA Airport API
 */
function getDistBetweenAirports() {
    var airCode01 = $("#airport1").data("airCode");
    var airCode02 = $("#airport2").data("airCode");
    
    if(!validateForm()){
        return false;
    }

    $.ajax({
        type: 'GET',
        url: "https://airport.api.aero/airport/distance/" + airCode01 + "/" + airCode02 + "?user_key=a9ff64aa62119e73340ab37b56c64996&units=mile",
        dataType: 'jsonp',
        success: function(data) {
                var nauticalMiles = convertMileToNautMile(data.distance);
                $("#distanceTotal").val('The distance between ' + airCode01 + ' & ' + airCode02 + ' is ' + nauticalMiles + ' nautical miles.').removeClass('error').addClass('success');
                $(".airport-distance").removeClass('has-error').addClass('has-success');
        },
        error: function(xhr, status, err) {
            console.error("An error has occured: Status: " + status + " Error: " + err.toString());
        }
    });
}

/**
 * Validate that the user has made a valid selection
 * Returns true if the form fields have valid selections else returns false
 * @return {Boolean} 
 */
function validateForm(){
    var fieldVal01 = $.grep(airportArr, function(e){ return e.label == $(fieldArr[0]).val(); });
    var fieldVal02 = $.grep(airportArr, function(e){ return e.label == $(fieldArr[1]).val(); });
    if(fieldVal01 == 0 || fieldVal02 == 0){
        $("#distanceTotal").val('Error: please check your selection and try again').addClass('error');
        $(".airport-distance").addClass('has-error');
        return false;
    }
    else{
        return true;
    }
}


/**
 * Convert miles to nautical miles
 * @param {Number}  mile miles that will be converted to nautical miles
 * @return {Number} the converted value
 */
function convertMileToNautMile(mile) {
    return parseFloat((mile).replace(',', '')) * 0.868976;
}

/**
 * Initiate google map
 */
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 37.09024, lng: -95.712891 },
        zoom: 4
    });
}

/**
 * Draw flight path along with origin and destination markers on the map
 */
function setMapObjects() {
    //Clear the map
    if (mapFlightPath) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        mapFlightPath.setMap(null);
    }

    var flightPath = [];
    var airportLoc = [
        [parseFloat($("#airport1").data("airLat")), parseFloat($("#airport1").data("airLong"))],
        [parseFloat($("#airport2").data("airLat")), parseFloat($("#airport2").data("airLong"))]
    ];

    for (var i = 0; i < airportLoc.length; i++) {
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(airportLoc[i][0], airportLoc[i][1]),
            map: map
        });

        flightPath.push({ lat: airportLoc[i][0], lng: airportLoc[i][1] });

        markers.push(marker);
    }

    mapFlightPath = new google.maps.Polyline({
        path: flightPath,
        geodesic: true,
        strokeColor: 'red',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    mapFlightPath.setMap(map);
}

getListOfAirports();
bindEventHandlers();
