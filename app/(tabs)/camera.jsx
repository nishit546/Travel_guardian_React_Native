import {View,Text,Button,Image} from "react-native"
import {useCameraPermissions,CameraView} from "expo-camera"
import { useState } from "react";
const CameraScreen = () => {
const [cameraPermission,requestCameraPermission] = useCameraPermissions();
const [facing,setFacing] = useState("back");
const [flash,setFlash] = useState("off");
const [photo,setPhoto] = useState(null);
const cameraRef = useRef();
if(!cameraPermission){
    return(
        <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
            <Text style={{margin:10}}>
                We need your permission to show the camera
            </Text>
            <Button title="Grant camera permission" onPress={requestCameraPermission}/>
        </View>
    )
}
const handleClickCapture = async() => {
    const photo = await cameraRef.current.takePictureAsync();
    setPhoto(photo.uri);
}
const changeFlash =() => {
    if(flash == "off"){
        setFlash("on");
    }
    else if(flash == "on"){
        setFlash("auto")
    }
    else{
        setFlash("off")
    }
}

return(
    <View>
<CameraView ref={cameraRef} facing={facing} flash={flash} />
<Button title="Flip camera" onPress={() => setFacing((current) => current == "back" ? "front" : "back")}/>
<Button title="Take picture" onPress={handleClickCapture}/>
<Button title="change flash" onPress={changeFlash}/>
<Button title={torch ? "Torch : ON" : "Torch : Off"} onPress={() => setTorch((current) => current == !current)}/>
    </View>
)
}