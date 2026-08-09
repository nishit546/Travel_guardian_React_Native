import {View,Text,Button,Image,Linking,Share} from "react-native";
import * as Location from "expo-location";
import {useRef,useState,useEffect} from "react";
import {CameraView} from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";  
import * as FileSystem from "expo-file-systemlegacy"; 
import * as Sharing from "expo-sharing";

const CameraLocation = () => {
    const cameraRef = useRef(null);
    const [capturedData,setCapturedData] = useState(null);
    const [journal,setJournal] = useState([]);
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
   const capturePhoto = async () => {
    try {

        const currLocation =
            await getCurrentLocation();

        if (!currLocation) {
            return;
        }

        const photo =
            await cameraRef.current.takePictureAsync();

        const result =
            await Location.reverseGeocodeAsync({
                latitude: currLocation.coords.latitude,
                longitude: currLocation.coords.longitude,
            });

        const address =
            result.length > 0
                ? result[0]
                : null;

        const data = {
            uri: photo.uri,
            latitude: currLocation.coords.latitude,
            longitude: currLocation.coords.longitude,
            accuracy: currLocation.coords.accuracy,
            timestamp: Date.now(),
            address: address,
        };

        setCapturedData(data);

        const storedJournal =
            await AsyncStorage.getItem("travelJournal");

        const previousJournal =
            storedJournal
                ? JSON.parse(storedJournal)
                : [];

        const updatedJournal = [
            ...previousJournal,
            data,
        ];

        setJournal(updatedJournal);

        await saveJournal(updatedJournal);

    } catch (error) {

        console.log(
            "Error capturing photo:",
            error
        );

        alert("Failed to capture photo");

    }
};

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
        const latitude =  capturedData.latitude;
        const longitude =  capturedData.longitude;
         await Share.share({
        message:
            `My current location:\n\n` +
            `Latitude: ${latitude}\n` +
            `Longitude: ${longitude}\n\n` +
            `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    });
    }   
    const saveJournal = async (journalData) => {
    try {
        await AsyncStorage.setItem(
            "travelJournal",
            JSON.stringify(journalData)
        );
    } catch (error) {
        console.log("Error saving journal:", error);
    }
};
    const loadJournal = async () => {
    try {
        const storedJournal =
            await AsyncStorage.getItem("travelJournal");

        if (storedJournal) {
            const parsedJournal = JSON.parse(storedJournal);
            setJournal(parsedJournal);
        }
    } catch (error) {
        console.log("Error loading journal:", error);
    }
};
const exportJournal = async () => {

    try {

        if (journal.length === 0) {
            alert("Travel journal is empty");
            return;
        }

        const jsonData = JSON.stringify(
            journal,
            null,
            2
        );

        const fileUri =
            FileSystem.documentDirectory +
            "travelJournal.json";

        await FileSystem.writeAsStringAsync(
            fileUri,
            jsonData
        );

        const canShare =
            await Sharing.isAvailableAsync();

        if (!canShare) {
            alert("Sharing is not available");
            return;
        }

        await Sharing.shareAsync(
            fileUri,
            {
                mimeType: "application/json",
                dialogTitle: "Export Travel Journal",
                UTI: "public.json",
            }
        );

    } catch (error) {

        console.log(
            "Export error:",
            error
        );

        alert("Failed to export journal");

    }
};
    useEffect(() => {
        loadJournal();
    },[]);

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
        <Button title="Open Google Maps" onPress={openGoogleMaps}/>
        <Button title="Share Location" onPress={shareLocation}/>
        <Button title="Export Journal as JSON" onPress={exportJournal}/>
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
{journal.map((item, index) => (

    <View key={index}>

        <Image
            source={{ uri: item.uri }}
            style={{
                width: 200,
                height: 200,
            }}
        />

        <Text>
            Latitude: {item.latitude}
        </Text>

        <Text>
            Longitude: {item.longitude}
        </Text>

        <Text>
            City: {item.address?.city || "N/A"}
        </Text>

        <Text>
            Date:{" "}
            {new Date(
                item.timestamp
            ).toLocaleString()}
        </Text>

    </View>

))}
    </View>
)
}
export default CameraLocation;