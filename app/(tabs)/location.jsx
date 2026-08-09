import { useRef, useState } from "react"
import {View,Text,Button} from "react-native"
import * as Location from 'expo-location';
const LocationScreen = () => {
    const [location,setLocation] = useState(null);
    const [address,setAddress] = useState(null);
    const [locationType,setLocationType] = useState(null);
    const [searchLocation,setSearchLocation] = useState(null);
    const [heading,setHeading]  = useState(null);
    const headingRef = useRef(null);
    const liveRef = useRef(null);
    const handleLocation = async() => {
       const permission = await Location.requestForegroundPermissionsAsync();
       if(permission.status != "granted"){
        alert("Please grant permission to access location");
        return;
       }
       const lastLocation = await Location.getLastKnownPositionAsync();
     if(lastLocation){
        setLocation(lastLocation);
        setLocationType("Last Known Location")
     }
     const currLocation = await Location.getCurrentPositionAsync({
        accuracy:Location.Accuracy.High
     });
     setLocation(currLocation);
     setLocationType("Current Location")

    }
    const startTracking = async() => {
        liveRef.current = await Location.watchPositionAsync({
            accuracy:Location.Accuracy.Highest,
            timeInterval:2000,
            distanceInterval:1
        },(location) => {
            setLocation(location)
            setLocationType("Live Tracking")
        })
    }
    const stopTracking = () => {
        if(liveRef.current){

            liveRef.current.remove();
            liveRef.current = null;
        }
    }
    const geoCoding = async() => {
        if(!location){
            alert("Get location first")
            return;
        }
        const address = await Location.reverseGeocodeAsync({
            latitude:location.coords.latitude,
            longitude:location.coords.longitude
        });
        setAddress(address[0]);
    }
    const geoCodeAddress = async() => {
        const result = await Location.geocodeAsync(
            "Kalol, Gandhinagar"
        );
        if(result.length > 0){
            setSearchLocation(result[0]);
        }
    }
 const stopCompass = async() => {
    if(headingRef.current){
        headingRef.current.remove();
        headingRef.current = null;
    }
 }

return(
    <View>
        <Text style={{textAlign:"center",fontSize:24,fontWeight:"bold",marginBottom:12}}>Location</Text>
        <Button title="Get Current Location" onPress={handleLocation}/>
        <Button title="Start Tracking" onPress={startTracking}/>
        <Button title="Stop tracking" onPress={stopTracking}/>
        <Button title="GeoCode Address" onPress={geoCodeAddress}/>
        <Button title="Get Address" onPress={geoCoding}/>
        <Button title="Start compass" onPress={startCompass}/>
        <Button title="Stop compass" onPress={stopCompass}/>
        {location && (
            <View>
            <Text>Location Type : {locationType }</Text>
            <Text>Latitude : {location.coords.latitude}</Text>
            <Text>Longitude:{location.coords.longitude}</Text>
            <Text>Accuracy : {location.coords.accuracy} meters</Text>
            <Text>Heading : {location.coords.heading}</Text>
            <Text>Speed : {location.coords.speed}</Text>
            <Text>TimeStamp : {location.timestamp}</Text>
            </View>
        )}
        {address && (
            <View> 
                <Text>City : {address.city}</Text>
                <Text>Region : {address.region}</Text>
                <Text>Country : {address.country}</Text>
             </View>   
        )}
        {searchLocation && (
            <View>
                <Text>Latitude: {searchLocation.latitude}</Text>
                <Text>Longitude:{searchLocation.longitude}</Text>
                </View>
        )}
       {heading !==null && (
        <View>
        <Text>
            Compass Heading: {heading}
        </Text>
        </View>
       )}
    </View>
    
)
}
export default LocationScreen