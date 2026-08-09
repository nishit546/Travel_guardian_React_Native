import { useState } from "react"
import {View,Text,Button} from "react-native"
import * as Location from 'expo-location';
const LocationScreen = () => {
    const [location,setLocation] = useState(null);
    const [locationType,setLocationType] = useState(null);
    const handleLocation = async() => {
       const permission = await Location.requestForegroundPermissionsAsync();
       if(permission.status != "granted"){
        alert("Please grant permission to access location");
       }
       const lastLocation = await Location.getLastKnownPositionAsync();
     if(location){
        setLocation(lastLocation);
        setLocationType("Last Known Location")
     }
     const currLocation = await Location.getCurrentPositionAsync({
        accuracy:Location.Accuracy.High
     });
     setLocation(currLocation);
     setLocationType("Current Location")

    }
return(
    <View>
        <Text style={{textAlign:"center",fontSize:24,fontWeight:"bold",marginBottom:12}}>Location</Text>
        <Button title="Get Current Location" onPress={handleLocation}/>
        {location && (
            <View>
            <Text>Location Type : {locationType }</Text>
            <Text>Latitude : {location.coords.latitude}</Text>
            <Text>Longitude:{location.coords.longitude}</Text>
            <Text>Accuracy : {location.coords.accuracy}</Text>
            </View>
        )}
    </View>
)
}
export default LocationScreen