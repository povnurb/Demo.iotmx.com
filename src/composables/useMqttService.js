import mqtt from 'mqtt'
import {reactive, ref} from 'vue'
import { useToast } from "vue-toastification"

const useMqttService = ()=>{
    const qosList = [0,1,2]
    const connection = reactive({
        protocol: "ws",
        host: "140.84.188.157",
        port: 8073,
        endpoint: "/mqtt",
        clean: true,
        keepalive: 60,
        connectTimeout: 30*1000, //ms
        reconnectPeriod: 4000, //ms
        clientId: "mqtt_vue3_" + Math.random().toString(16).substring(2,8),
        // auth
        username: "lalo",
        password: "public"
    })
    // subscription
    const subscription = ref({
        topic: 'v1/devices/lalo/ESPWROOM32A11B5AE04002/#',
        qos: 0
    })
    // publish
    const publish = ref({
        topic: 'testtopic/home',
        qos: 0,
        payload: '{ "msg": "Hello, I am IOTMX Broker" }' 
    })
    const receiveNews = ref("")
    const receiveTopic = ref("")
    let mensaje = ref("")  //--------------------------------------------------------------------
    // Nota: quitar let y poner const
    const client = ref({
        connected: false
    })
    const subscribeSuccess = ref(false)
    const btnLoadingType = ref("")
    const retryTimes = ref(0);

    // Funtions
    // init data
    const initData = ()=>{
        client.value = {
            connected: false
        }
        retryTimes.value = 0
        btnLoadingType.value = ""
        subscribeSuccess.value = false
    }
    // Reconnect
    const handleOnReConnect = ()=>{
        retryTimes.value += 1
        if(retryTimes.value > 5){
            try {
                client.value.end()
                initData()
                console.log("connection maxReconnectTimes limit, stop retry")
                ToastMsgWarning("connection maxReconnectTimes limit, stop retry", 5000)
            } catch (error) {
                console.log("handleOnReConnect catch error: ", error)
                ToastMsgError("handleOnReConnect catch error: " + error, 5000)
            }
        }
    }
    // Create connection to mqtt
    const createConnection = ()=>{
        try {
            btnLoadingType.value = "connect"
            const { protocol, host, port, endpoint, ...options} = connection
            const connectUrl = `${protocol}://${host}:${port}${endpoint}`

            client.value = mqtt.connect(connectUrl, options)

            if(client.value.on){
                client.value.on("connect", ()=>{
                    btnLoadingType.value = ""
                    console.log("connection successful")
                    ToastMsgSuccess(`connection successful`, 5000)
                })
                client.value.on("reconnect", handleOnReConnect)
                client.value.on("error", (error)=>{
                    console.log("connection error: ", error)
                    ToastMsgError("connection error: " + error, 5000)
                })
                // mensajes entrantes
                client.value.on("message", (topic, message)=>{
                    //message es un array de caracteres del codigo ascci
                    try {
                        //se ejecuta si es un un formato JSON
                        receiveNews.value = JSON.stringify(JSON.parse(message), null, 2)
                        mensaje = JSON.parse(message.toString())  // -----se convierte en un string legible------------------------------------
                        //receiveNews.value = JSON.stringify(JSON.parse(message))
                        receiveTopic.value = topic
                        processData()
                    } catch (error) {
                        //se ejecuta si no es un JSON
                        receiveNews.value = message
                        receiveTopic.value = topic
                    }
                    //console.log(`received message: ${message} from topic: ${topic}`)
                    //console.log(mensaje.ALARM_STATUS1)
                    //console.log(mensaje.ALARM_TIMEON1)
                    //console.log(mensaje.ALARM_STATUS2)
                    //console.log(mensaje.ALARM_TIMEON2)
                })
            }
        } catch (error) {
            btnLoadingType.value = ""
            console.log("mqtt connect error: ", error)
            ToastMsgError("mqtt connect error: " + error, 5000)
        }
    }
    // change
    const handleProtocolChange = (value)=>{
        connection.port = value.target.value === "wss" ? 8074 : 8073
        connection.host = value.target.value === "wss" ? "iotmx.com" : "140.84.188.157"
    }
    // destroyConnection
    const destroyConnection =()=>{
        if(client.value.connected){
            btnLoadingType.value = "disconnect"
            try {
                client.value.end(false, ()=>{
                    initData()
                    console.log("disconnected successfully")
                    ToastMsgSuccess("disconnected successfully", 5000)
                })
            } catch (error) {
                btnLoadingType.value = ""
                console.log("disconnect error: ", error)
                ToastMsgError("disconnect error: " + error, 5000)
            }
        }
    }
    // doSubscribe
    const doSubscribe =()=>{
        btnLoadingType.value = "subscribe"
        const {topic, qos} = subscription.value
        client.value.subscribe(
            topic,
            {qos},
            (error, granted)=>{
                btnLoadingType.value = ""
                if(error){
                    console.log("subscribe error: ", error)
                    ToastMsgError("subscribe error: " + error, 5000)
                    return
                }
                subscribeSuccess.value = true
                console.log("subscribe successfully:", granted);
                ToastMsgSuccess(`subscribe successfully: ${topic}`, 5000)
            }
        )
    }
    // doUnSubscribe
    const doUnSubscribe=()=>{
        btnLoadingType.value = "unsubscribe"
        const {topic, qos} = subscription.value
        client.value.unsubscribe(
            topic,
            {qos},
            (error)=>{
                btnLoadingType.value = ""
                subscribeSuccess.value = false
                if(error){
                    console.log("unsubscribe error:", error)
                    ToastMsgError("unsubscribe error: " + error, 5000)
                    return
                }
                console.log(`unsubscribed topic: ${topic}`);
                ToastMsgWarning(`unsubscribed topic: ${topic}`, 5000)
            }
        )
    }
    // doPublish
    const doPublish=()=>{
        btnLoadingType.value = "publish"
        const { topic, qos, payload } = publish.value
        client.value.publish(
            topic, 
            payload, 
            {qos}, 
            (error)=>{
                btnLoadingType.value = ""
                if(error){
                    console.log("publish error:", error);
                    ToastMsgError("publish error: " + error, 5000)
                    return
                }
                console.log(`published message: ${payload}`)
                ToastMsg(`published message: ${payload}`, 5000)
            }
        )
    }
    // Toast
    const toast = useToast()
    const ToastMsg = (msg, time)=>{
        toast(msg,{
            timeout: time
        })
    }
    const ToastMsgError = (msg, time)=>{
        toast.error(msg,{
            timeout: time
        })
    }
    const ToastMsgWarning = (msg, time)=>{
        toast.warning(msg,{
            timeout: time
        })
    }
    const ToastMsgInfo = (msg, time)=>{
        toast.info(msg,{
            timeout: time
        })
    }
    const ToastMsgSuccess = (msg, time)=>{
        toast.success(msg,{
            timeout: time
        })
    }

    function processData(){
        document.getElementById('device_serial').innerHTML = mensaje.device_serial;
        document.getElementById('temp_cpu').innerHTML = mensaje.temp_cpu;
        document.getElementById('tempC').innerHTML = mensaje.tempC;
        document.getElementById('tmin').innerHTML = mensaje.tmin;
        document.getElementById('tmax').innerHTML = mensaje.tmax;  
        document.getElementById('humedad').innerHTML = mensaje.humedad;
        document.getElementById('ALARM_NAME1').innerHTML = mensaje.ALARM_NAME1;
        document.getElementById('ALARM_NAME2').innerHTML = mensaje.ALARM_NAME2;
        document.getElementById('ALARM_NAME3').innerHTML = mensaje.ALARM_NAME3;
        document.getElementById('ALARM_NAME4').innerHTML = mensaje.ALARM_NAME4;
        document.getElementById('ALARM_NAME5').innerHTML = mensaje.ALARM_NAME5;
        document.getElementById('ALARM_NAME6').innerHTML = mensaje.ALARM_NAME6;
        document.getElementById('ALARM_NAME7').innerHTML = mensaje.ALARM_NAME7;
        document.getElementById('ALARM_NAME8').innerHTML = mensaje.ALARM_NAME8;
        document.getElementById('ALARM_TIMEON1').innerHTML = mensaje.ALARM_TIMEON1;
        document.getElementById('ALARM_TIMEON2').innerHTML = mensaje.ALARM_TIMEON2;
        document.getElementById('ALARM_TIMEON3').innerHTML = mensaje.ALARM_TIMEON3;
        document.getElementById('ALARM_TIMEON4').innerHTML = mensaje.ALARM_TIMEON4;
        document.getElementById('ALARM_TIMEON5').innerHTML = mensaje.ALARM_TIMEON5;
        document.getElementById('ALARM_TIMEON6').innerHTML = mensaje.ALARM_TIMEON6;
        document.getElementById('ALARM_TIMEON7').innerHTML = mensaje.ALARM_TIMEON7;
        document.getElementById('ALARM_TIMEON8').innerHTML = mensaje.ALARM_TIMEON8;
        document.getElementById('ALARM_TIMEOFF1').innerHTML = mensaje.ALARM_TIMEOFF1;
        document.getElementById('ALARM_TIMEOFF2').innerHTML = mensaje.ALARM_TIMEOFF2;
        document.getElementById('ALARM_TIMEOFF3').innerHTML = mensaje.ALARM_TIMEOFF3;
        document.getElementById('ALARM_TIMEOFF4').innerHTML = mensaje.ALARM_TIMEOFF4;
        document.getElementById('ALARM_TIMEOFF5').innerHTML = mensaje.ALARM_TIMEOFF5;
        document.getElementById('ALARM_TIMEOFF6').innerHTML = mensaje.ALARM_TIMEOFF6;
        document.getElementById('ALARM_TIMEOFF7').innerHTML = mensaje.ALARM_TIMEOFF7;
        document.getElementById('ALARM_TIMEOFF8').innerHTML = mensaje.ALARM_TIMEOFF8;
        document.getElementById('ALARM_CONT1').innerHTML = mensaje.ALARM_CONT1;
        document.getElementById('ALARM_CONT2').innerHTML = mensaje.ALARM_CONT2;
        document.getElementById('ALARM_CONT3').innerHTML = mensaje.ALARM_CONT3;
        document.getElementById('ALARM_CONT4').innerHTML = mensaje.ALARM_CONT4;
        document.getElementById('ALARM_CONT5').innerHTML = mensaje.ALARM_CONT5;
        document.getElementById('ALARM_CONT6').innerHTML = mensaje.ALARM_CONT6;
        document.getElementById('ALARM_CONT7').innerHTML = mensaje.ALARM_CONT7;
        document.getElementById('ALARM_CONT8').innerHTML = mensaje.ALARM_CONT8;

        //ALARM_CONT
        //condicionales
        if(!mensaje.ALARM_STATUS1){ //si hay una alarma
            document.getElementById('ALARMA1').classList.remove('btn-success');
            document.getElementById('ALARMA1').classList.add('btn-danger');
            document.getElementById('ALARM_TIMEOFF1').style.visibility='hidden';
            document.getElementById('ALARM_TIMEON1').innerHTML = mensaje.ALARM_TIMEON1? mensaje.ALARM_TIMEON1:""; 
          
        }else{
            document.getElementById('ALARMA1').classList.remove('btn-danger');
            document.getElementById('ALARMA1').classList.add('btn-success');
            if(mensaje.ALARM_TIMEON1!=0){
            document.getElementById('ALARM_TIMEON1').innerHTML = mensaje.ALARM_TIMEON1;
            document.getElementById('ALARM_TIMEOFF1').style.visibility='visible';
            document.getElementById('ALARM_TIMEOFF1').innerHTML = mensaje.ALARM_TIMEOFF1;
            }
        }
        if(!mensaje.ALARM_STATUS2){ //si hay una alarma
            document.getElementById('ALARMA2').classList.remove('btn-success');
            document.getElementById('ALARMA2').classList.add('btn-danger');
            document.getElementById('ALARM_TIMEOFF2').style.visibility='hidden';
            document.getElementById('ALARM_TIMEON2').innerHTML = mensaje.ALARM_TIMEON2? mensaje.ALARM_TIMEON2:"";
            
        }else{
            document.getElementById('ALARMA2').classList.remove('btn-danger');
            document.getElementById('ALARMA2').classList.add('btn-success');
            if(mensaje.ALARM_TIMEON2!=0){
            document.getElementById('ALARM_TIMEON2').innerHTML = mensaje.ALARM_TIMEON2;
            document.getElementById('ALARM_TIMEOFF2').style.visibility='visible';
            document.getElementById('ALARM_TIMEOFF2').innerHTML = mensaje.ALARM_TIMEOFF2;
            }
        }
        if(!mensaje.ALARM_STATUS3){ //si hay una alarma
            document.getElementById('ALARMA3').classList.remove('btn-success');
            document.getElementById('ALARMA3').classList.add('btn-danger');
            document.getElementById('ALARM_TIMEOFF3').style.visibility='hidden';
            document.getElementById('ALARM_TIMEON3').innerHTML = mensaje.ALARM_TIMEON3? mensaje.ALARM_TIMEON3:"";
        }else{
            document.getElementById('ALARMA3').classList.remove('btn-danger');
            document.getElementById('ALARMA3').classList.add('btn-success');
            if(mensaje.ALARM_TIMEON3!=0){
            document.getElementById('ALARM_TIMEON3').innerHTML = mensaje.ALARM_TIMEON3;
            document.getElementById('ALARM_TIMEOFF3').style.visibility='visible';
            document.getElementById('ALARM_TIMEOFF3').innerHTML = mensaje.ALARM_TIMEOFF3;
            }
        }
        if(!mensaje.ALARM_STATUS4){ //si hay una alarma
            document.getElementById('ALARMA4').classList.remove('btn-success');
            document.getElementById('ALARMA4').classList.add('btn-danger');
            document.getElementById('ALARM_TIMEOFF4').style.visibility='hidden';
            document.getElementById('ALARM_TIMEON4').innerHTML = mensaje.ALARM_TIMEON4? mensaje.ALARM_TIMEON4:"";
        }else{
            document.getElementById('ALARMA4').classList.remove('btn-danger');
            document.getElementById('ALARMA4').classList.add('btn-success');
            if(mensaje.ALARM_TIMEON4!=0){
            document.getElementById('ALARM_TIMEON4').innerHTML = mensaje.ALARM_TIMEON4;
            document.getElementById('ALARM_TIMEOFF4').style.visibility='visible';
            document.getElementById('ALARM_TIMEOFF4').innerHTML = mensaje.ALARM_TIMEOFF4;
            }
        }
        if(!mensaje.ALARM_STATUS5){ //si hay una alarma
            document.getElementById('ALARMA5').classList.remove('btn-success');
            document.getElementById('ALARMA5').classList.add('btn-danger');
            document.getElementById('ALARM_TIMEOFF5').style.visibility='hidden';
            document.getElementById('ALARM_TIMEON5').innerHTML = mensaje.ALARM_TIMEON5? mensaje.ALARM_TIMEON5:"";

        }else{
            document.getElementById('ALARMA5').classList.remove('btn-danger');
            document.getElementById('ALARMA5').classList.add('btn-success');
            if(mensaje.ALARM_TIMEON5!=0){
            document.getElementById('ALARM_TIMEON5').innerHTML = mensaje.ALARM_TIMEON5;
            document.getElementById('ALARM_TIMEOFF5').style.visibility='visible';
            document.getElementById('ALARM_TIMEOFF5').innerHTML = mensaje.ALARM_TIMEOFF5;
            }
        }
        if(!mensaje.ALARM_STATUS6){ //si hay una alarma
            document.getElementById('ALARMA6').classList.remove('btn-success');
            document.getElementById('ALARMA6').classList.add('btn-danger');
            document.getElementById('ALARM_TIMEOFF6').style.visibility='hidden';
            document.getElementById('ALARM_TIMEON6').innerHTML = mensaje.ALARM_TIMEON6? mensaje.ALARM_TIMEON6:"";
        }else{
            document.getElementById('ALARMA6').classList.remove('btn-danger');
            document.getElementById('ALARMA6').classList.add('btn-success');
            if(mensaje.ALARM_TIMEON6!=0){
            document.getElementById('ALARM_TIMEON6').innerHTML = mensaje.ALARM_TIMEON6;
            document.getElementById('ALARM_TIMEOFF6').style.visibility='visible';
            document.getElementById('ALARM_TIMEOFF6').innerHTML = mensaje.ALARM_TIMEOFF6;
            }
        }
        if(!mensaje.ALARM_STATUS7){ //si hay una alarma
            document.getElementById('ALARMA7').classList.remove('btn-success');
            document.getElementById('ALARMA7').classList.add('btn-danger');
            document.getElementById('ALARM_TIMEOFF7').style.visibility='hidden';
            document.getElementById('ALARM_TIMEON7').innerHTML = mensaje.ALARM_TIMEON7? mensaje.ALARM_TIMEON7:"";

        }else{
            document.getElementById('ALARMA7').classList.remove('btn-danger');
            document.getElementById('ALARMA7').classList.add('btn-success');
            if(mensaje.ALARM_TIMEON7!=0){
            document.getElementById('ALARM_TIMEON7').innerHTML = mensaje.ALARM_TIMEON7;
            document.getElementById('ALARM_TIMEOFF7').style.visibility='visible';
            document.getElementById('ALARM_TIMEOFF7').innerHTML = mensaje.ALARM_TIMEOFF7;
            }
        }
        if(!mensaje.ALARM_STATUS8){ //si hay una alarma
            document.getElementById('ALARMA8').classList.remove('btn-success');
            document.getElementById('ALARMA8').classList.add('btn-danger');
            document.getElementById('ALARM_TIMEOFF8').style.visibility='hidden';
            document.getElementById('ALARM_TIMEON8').innerHTML = mensaje.ALARM_TIMEON8? mensaje.ALARM_TIMEON8:"";

        }else{
            document.getElementById('ALARMA8').classList.remove('btn-danger');
            document.getElementById('ALARMA8').classList.add('btn-success');
            if(mensaje.ALARM_TIMEON8!=0){
            document.getElementById('ALARM_TIMEON8').innerHTML = mensaje.ALARM_TIMEON8;
            document.getElementById('ALARM_TIMEOFF8').style.visibility='visible';
            document.getElementById('ALARM_TIMEOFF8').innerHTML = mensaje.ALARM_TIMEOFF8;
            }
        }
        if(mensaje.prueba){
            document.getElementById('ALARMA1').classList.remove('btn-success');
            document.getElementById('ALARMA2').classList.remove('btn-success');
            document.getElementById('ALARMA3').classList.remove('btn-success');
            document.getElementById('ALARMA4').classList.remove('btn-success');
            document.getElementById('ALARMA5').classList.remove('btn-success');
            document.getElementById('ALARMA6').classList.remove('btn-success');
            document.getElementById('ALARMA7').classList.remove('btn-success');
            document.getElementById('ALARMA8').classList.remove('btn-success');
            document.getElementById('ALARMA1').classList.add('btn-danger');
            document.getElementById('ALARMA2').classList.add('btn-danger');
            document.getElementById('ALARMA3').classList.add('btn-danger');
            document.getElementById('ALARMA4').classList.add('btn-danger');
            document.getElementById('ALARMA5').classList.add('btn-danger');
            document.getElementById('ALARMA6').classList.add('btn-danger');
            document.getElementById('ALARMA7').classList.add('btn-danger');
            document.getElementById('ALARMA8').classList.add('btn-danger');

        }
    }
    return{
        mensaje, //-----------------------------------------------------
        qosList,
        connection,
        subscription,
        publish,
        receiveNews,
        receiveTopic,
        client,
        btnLoadingType,
        subscribeSuccess,
        createConnection,
        handleProtocolChange,
        destroyConnection,
        doSubscribe,
        doUnSubscribe,
        doPublish
    }
}

export default useMqttService