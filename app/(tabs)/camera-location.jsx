import {View,Text,Button,Image,Linking,Share} from "react-native";
import * as Location from "expo-location";
import {useRef,useState} from "react";
import {CameraView} from "expo-camera";
const CameraLocation = () => {
    const cameraRef = useRef(null);
    const [capturedData,setCapturedData] = useState(null);

    const getCurrentLocation = async() => {
        const permission = await Location.requestForegroundPermissionsAsync();
        if(permission.status !== 'granted'){
          alert("Please grant location permission")
          return;
        }
        const currLocation = await Location.getCurrentPositionAsync({
            accuracy:Location.Accuracy.High,
        });
        return currLocation;
    }
    const capturePhoto = async() => {
        const currLocation = await getCurrentLocation();
        if(!currLocation){
            return;
        }
        const photo = await cameraRef.current.takePictureAsync();
        const result = await Location.reverseGeocodeAsync({
            latitude: currLocation.coords.latitude,
            longitude: currLocation.coords.longitude
        });
        const address = result.length > 0 ? result[0] : null;
        const data = {
            uri:photo.uri,
            latitude:currLocation.coords.latitude,
            longitude:currLocation.coords.longitude,
            accuracy:currLocation.coords.accuracy,
            timestamp:Date.now(),
            address:address,
        }
        setCapturedData(data);
        
    }
    const openGoogleMaps = async() => {
        if(!capturedData){
            alert("Capture a photo first")
            return;

        }
        const latitude  = capturedData.latitude;
        const longitude = capturedData.longitude;
        const url =
        `https://www.google.com/maps/search/?api=1&query=` +
        `${latitude},${longitude}`;
        await Linking.openURL(url);
    }
    const shareLocation = async() => {
        if(!capturedData){
            alert("Capture a photo")
            return;
        }
        const latitude = await capturedData.latitude;
        const longitude = await capturedData.longitude;
         await Share.share({
        message:
            `My current location:\n\n` +
            `Latitude: ${latitude}\n` +
            `Longitude: ${longitude}\n\n` +
            `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    });
    }

return(
    <View>
        <Text>Camera Location</Text>
        <CameraView
    ref={cameraRef}
    style={{ flex: 1 }}
    facing="back"
    mode="picture"
/>
        <Button title="Capture Photo + Location" onPress={capturePhoto}/>
       {capturedData && (
    <View
    style={{
        position: "relative",
        width: 300,
        height: 300,
    }}
>
    <Image
        source={{ uri: capturedData.uri }}
        style={{
            width: 300,
            height: 300,
        }}
    />

    <View
        style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            backgroundColor: "rgba(0,0,0,0.65)",
            padding: 8,
            borderRadius: 5,
        }}
    >

        <Text style={{ color: "white" }}>
            {capturedData.address?.city || "Unknown"}
            {capturedData.address?.region
                ? `, ${capturedData.address.region}`
                : ""}
        </Text>

        <Text style={{ color: "white" }}>
            {capturedData.latitude.toFixed(5)}
            {" , "}
            {capturedData.longitude.toFixed(5)}
        </Text>

        <Text style={{ color: "white" }}>
            Accuracy:{" "}
            {capturedData.accuracy?.toFixed(1)}
            {" "}meters
        </Text>

        <Text style={{ color: "white" }}>
            {new Date(
                capturedData.timestamp
            ).toLocaleString()}
        </Text>

    </View>

</View>
)}
{capturedData.address && (

            <View>

                <Text>
                    Street:{" "}
                    {capturedData.address.street || "N/A"}
                </Text>

                <Text>
                    City:{" "}
                    {capturedData.address.city || "N/A"}
                </Text>

                <Text>
                    Region:{" "}
                    {capturedData.address.region || "N/A"}
                </Text>

                <Text>
                    Country:{" "}
                    {capturedData.address.country || "N/A"}
                </Text>

            </View>

)}
    </View>
)
}
export default CameraLocation;