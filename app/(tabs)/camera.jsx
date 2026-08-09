import {View,Text,Button,Image} from "react-native"
import {useCameraPermissions,CameraView,useMicrophonePermissions} from "expo-camera"
import { useState,useRef,useEffect} from "react";
import {VideoView,useVideoPlayer} from "expo-video" 
const VideoPlayer = ({video}) => {
    const player = useVideoPlayer(video);
    return(
        <VideoView player={player} style={{width:100,height:100}} nativeControls/>
    )
}
const CameraScreen = () => {
const [cameraPermission,requestCameraPermission] = useCameraPermissions();
const [audioPermission,requestAudioPermission] = useMicrophonePermissions();
const [facing,setFacing] = useState("back");
const [flash,setFlash] = useState("off");
const [photo,setPhoto] = useState(null);
const [video,setVideo] = useState(null);
const [torch,setTorch] = useState(false);
const [mode,setMode] = useState("picture");
const cameraRef = useRef();

if(!cameraPermission || !audioPermission){
    return(
        <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
            <Text style={{margin:10}}>
                We need your permission to show the camera & mic
            </Text>
            <Button title="Grant camera & mic permission" onPress={() => {requestCameraPermission(); requestAudioPermission()}}/>
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
const startRecording = async() => {
    const video = await cameraRef.current.recordAsync();
    setVideo(video.uri);
}
const stopRecording = async() => {
    await cameraRef.current.stopRecording();

}

return(
    <View>
<CameraView style={{flex:1,height:500}}ref={cameraRef} facing={facing} flash={flash} mode="video" enableTorch={torch}/>
<Button title="Flip camera" onPress={() => setFacing((current) => current == "back" ? "front" : "back")}/>
<Button title="Take picture" onPress={handleClickCapture}/>
<Button title="change flash" onPress={changeFlash}/>
<Button title={torch ? "Torch : ON" : "Torch : Off"} onPress={() => setTorch((current) => current == !current)}/>
    <Button title="Start Recording" onPress={startRecording}/>
    <Button title="Stop recording" onPress={stopRecording}/>
{photo && (
    <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
    <Image source={{uri: photo}} style={{width: 100, height: 100}}/>
    </View>
)}  
{video && (
    <View>
        <Text style={{textAlign:"center",fontSize:24,fontWeight:"bold",marginBottom:12}}>Video Preview</Text>
<VideoPlayer video={video}/>
</View>
)}
    </View>
)
}