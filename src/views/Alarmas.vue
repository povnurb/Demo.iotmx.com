<template>
    <!-- -->
    <div class="container my-5">
    <!-- Connection -->
    <div class="card">
      <h5 class="card-header">Configuration: <span class="badge text-info">{{connection.protocol+'://'+connection.host+':'+connection.port+connection.endpoint}}</span></h5>
      <div class="card-body">
        <form class="row g-3">
          <div class="col-md-1">
            <!--Definiremos el protocolo-->
            <label for="protocol" class="form-label">Protocol</label>
            <select id="protocol" class="form-select"
            v-model="connection.protocol"
            :disabled="client.connected"
            @change="handleProtocolChange">
              <option label="ws://" value="ws"></option>
              <option label="wss://" value="wss"></option>
            </select>
          </div>

          <div class="col-md-3">
            <label for="host" class="form-label">Host</label>
            <input type="text" class="form-control" id="host"
            v-model="connection.host"
            :disabled="client.connected">
          </div>

          <div class="col-md-2">
            <label for="port" class="form-label">Port</label>
            <input type="number" class="form-control" id="port" placeholder="7083/8074"
            v-model="connection.port"
            :disabled="client.connected">
          </div>

          <div class="col-md-2">
            <label for="endpoint" class="form-label">Mountpoint</label>
            <input type="text" class="form-control" id="endpoint" placeholder="/mqtt"
            v-model="connection.endpoint"
            :disabled="client.connected">          
          </div>

          <div class="col-md-4">
            <label for="clientId" class="form-label">Client ID</label>
            <input type="text" class="form-control" id="clientId"
            v-model="connection.clientId"
            :disabled="client.connected">  
          </div>          
            
          <div class="col-md-4">
            <label for="username" class="form-label">Username</label>
            <input type="text" class="form-control" id="username"
            v-model="connection.username"
            :disabled="client.connected"> 
          </div>  
            <!--<input type="password" id="wifi_password" class="form-control" placeholder="*****">-->
          <div class="col-md-4">
            <label for="password" class="form-label">Password</label>
            <input type="password" class="form-control" id="password"
            v-model="connection.password"
            :disabled="client.connected">          
          </div>

          <div class="col-md-4">
            <label for="keepalive" class="form-label">Keep Alive</label>
            <input type="number" class="form-control" id="keepalive" min="0"
            v-model="connection.keepalive"
            :disabled="client.connected">          
          </div>

          <div class="col-4">
            <div class="form-check">
                <input class="form-checkbox-input" type="checkbox" id="clean"
                v-model="connection.clean"
                :disabled="client.connected">
                <label for="clean" class="form-label"> Clean Session </label>
            </div>
          </div>

          <div class="col-md-4">
            <button type="button" class="btn btn-primary btn-block"
            :disabled="client.connected"
            @click="createConnection"> 
            <span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"
            v-if="btnLoadingType === 'connect'"></span>
            {{client.connected ? "Connected" : "Connect"}}
            </button>             
          </div>

          <div class="col-md-4">        
            <button type="button" class="btn btn-danger btn-block" 
            v-if="client.connected"
            @click="destroyConnection">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
            v-if="btnLoadingType === 'disconnect'"></span>
            Disconnect
            </button> 
          </div>

        </form>
      </div>
    </div>
    <!-- Susbcribe / Publish -->
    <div class="row">
      <div class="col-sm-12 col-lg-6">
        <!-- Subscribe -->
        <div class="card mt-4">
          <h5 class="card-header">Subscribe</h5>
          <div class="card-body">
            <form class="row g-3">
              <div class="col-md-8">
                <label for="stopic" class="form-label">Topic</label>
                <input type="text" class="form-control" id="stopic"
                v-model="subscription.topic"
                :disabled="!client.connected || subscribeSuccess">
              </div>
              <div class="col-md-4">
                <label for="qos" class="form-label">QoS</label>
                <select id="qos" class="form-select"
                v-model="subscription.qos"
                :disabled="!client.connected || subscribeSuccess">
                  <option v-for="qos in qosList" 
                    :key="qos"
                    :label="qos"  
                    :value="qos">
                  </option>
                </select>
              </div>
              <div class="col-12">
                <button type="button" class="btn btn-primary btn-block"
                :disabled="!client.connected || subscribeSuccess"
                @click="doSubscribe"> 
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" 
                v-if="btnLoadingType === 'subscribe'"></span>
                {{ subscribeSuccess ? "Subscribed" : "Subscribe" }}
              </button>             
              </div>
              <div class="col-12">        
                <button type="button" class="btn btn-warning btn-block"
                v-if="subscribeSuccess"
                :disabled="!client.connected"
                @click="doUnSubscribe"> 
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" v-if="btnLoadingType === 'unsubscribe'"></span>
                Unsubscribe
              </button> 
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="col-sm-12 col-lg-6">
        <!-- Publish -->
        <div class="card mt-4">
          <h5 class="card-header">Publish</h5>
          <div class="card-body">
            <form class="row g-3">
              <div class="col-md-12">
                <label for="ptopic" class="form-label">Topic</label>
                <input type="text" class="form-control" id="ptopic" 
                v-model="publish.topic"
                :disabled="!client.connected">
              </div>
              <div class="col-md-8">
                <label for="payload" class="form-label">Payload</label>
                <input type="text" class="form-control" id="payload"
                v-model="publish.payload"
                :disabled="!client.connected">
              </div>
              <div class="col-md-4">
                <label for="pqos" class="form-label">QoS</label>
                <select id="pqos" class="form-select"
                v-model="publish.qos"
                :disabled="!client.connected">
                <option v-for="qos in qosList" 
                  :key="qos" 
                  :label="qos" 
                  :value="qos">
                </option>
                </select>
              </div>
              <div class="col-12">
                <button type="button" class="btn btn-primary btn-block"
                @click="doPublish"
                :disabled="!client.connected"> 
                Publish
                </button>             
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <!-- Receive -->
    <div class="card mt-4">
      <h5 class="card-header">Receive</h5>
      <div class="card-body">
        <div class="col-md-12 mb-3">
            Message on topic: <span class="badge text-bg-primary"> {{receiveTopic}} </span>
          </div>
          <div class="col-md-12">
            <textarea class="form-control" rows="10" cols="40" 
            v-model="receiveNews"
            :disabled="!client.connected"></textarea>
          </div>
      </div>
    </div>
  </div>
    <main id="main-container" :hidden="!client.connected">
        <!-- Page Content -->
    <!--Alarmas Inicio maquetado-->
            <!--verde btn-success-->
            <!--rojo btn-danger-->
            <!--colores: bg-gd-sun, bg-gd-sea, bg-gd-aqua, bg-gd-fruit, bg-xeco-light, bg-xeco-dark, btn-success, bg-black-->
            <div class="row items-push">
                <div class="col-sm-4">
                <div class="block block-rounded h-100 mb-0">
                    <div class="block-header block-header-default">
                    
                    <div class="block-options"> <!--indicAlarm.value["ALARM_STATUS1"]-->
                        <div class="fs-1 fw-bold"><span id="temp_cpu"></span> °C</div>
                        <div class="text-muted mb-3">Temperatura CPU del dispositivo</div>
                        <div class="text-muted mb-3">Device: <span class="badge text-info" id="device_serial"></span></div>
                    </div>
                    </div>
                    
                </div>
                </div>
                <div class="col-sm-4">
                <div class="block block-rounded h-100 mb-0">
                    <div class="block-header block-header-default">
                    
                    <div class="block-options">
                        <div class="fs-1 fw-bold"><span id="tempC"></span> °C</div>
                        <div class="text-muted mb-3">Temperatura Sala</div>
                        Min. <span id="tmin"></span> ° C - <span class="text-danger">Max. </span><span class="text-danger" id="tmax"></span><span class="text-danger">° C</span>
                    </div>
                    </div>
                    
                </div>
                </div>
                <div class="col-sm-4">
                <div class="block block-rounded h-100 mb-0">
                    <div class="block-header block-header-default">
                    
                    <div class="block-options">
                        <div class="fs-1 fw-bold"><span id="humedad"></span> %</div>
                        <div class="text-muted mb-3">Humedad Sala</div>
                    </div>
                    </div>
                    
                </div>
                </div>
            </div>
            
            <div class="content col-md-12 col-xl-12">
                <a class="bg-gd-aqua btn block-header mt-1">
                    <i class="" >#</i>
                    <div class="col-lg-4">ALARMA</div>
                    <div class="col-lg-4" >PRESENTE</div>
                    <div class="col-lg-4" >CLAREADA</div>
                </a>
                <a class="btn block-header btn-success mt-1" id="ALARMA1">
                    <i class="" id="ALARM_CONT1">  </i>
                    <div class="col-lg-4" id="ALARM_NAME1">  </div>
                    <div class="col-lg-4" id="ALARM_TIMEON1" >  </div>
                    <div class="col-lg-4" id="ALARM_TIMEOFF1">  </div>
                </a>
                <a class="btn block-header btn-success mt-1" id="ALARMA2">
                    <i class="" id="ALARM_CONT2">  </i>
                    <div class="col-lg-4" id="ALARM_NAME2">  </div>
                    <div class="col-lg-4" id="ALARM_TIMEON2" >  </div>
                    <div class="col-lg-4" id="ALARM_TIMEOFF2">  </div>
                </a>
                <a class="btn block-header btn-success mt-1" id="ALARMA3">
                    <i class="" id="ALARM_CONT3">  </i>
                    <div class="col-lg-4" id="ALARM_NAME3">  </div>
                    <div class="col-lg-4" id="ALARM_TIMEON3" >  </div>
                    <div class="col-lg-4" id="ALARM_TIMEOFF3">  </div>
                </a>
                <a class="btn block-header btn-success mt-1" id="ALARMA4">
                    <i class="" id="ALARM_CONT4">  </i>
                    <div class="col-lg-4" id="ALARM_NAME4">  </div>
                    <div class="col-lg-4" id="ALARM_TIMEON4" >  </div>
                    <div class="col-lg-4" id="ALARM_TIMEOFF4">  </div>
                </a>
                <a class="btn block-header btn-success mt-1" id="ALARMA5">
                    <i class="" id="ALARM_CONT5">  </i>
                    <div class="col-lg-4" id="ALARM_NAME5">  </div>
                    <div class="col-lg-4" id="ALARM_TIMEON5" >  </div>
                    <div class="col-lg-4" id="ALARM_TIMEOFF5">  </div>
                </a>
                <a class="btn block-header btn-success mt-1" id="ALARMA6">
                    <i class="" id="ALARM_CONT6">  </i>
                    <div class="col-lg-4" id="ALARM_NAME6">  </div>
                    <div class="col-lg-4" id="ALARM_TIMEON6" >  </div>
                    <div class="col-lg-4" id="ALARM_TIMEOFF6">  </div>
                </a>
                <a class="btn block-header btn-success mt-1" id="ALARMA7">
                    <i class="" id="ALARM_CONT7">  </i>
                    <div class="col-lg-4" id="ALARM_NAME7">  </div>
                    <div class="col-lg-4" id="ALARM_TIMEON7" >  </div>
                    <div class="col-lg-4" id="ALARM_TIMEOFF7">  </div>
                </a>
                <a class="btn block-header btn-success mt-1" id="ALARMA8">
                    <i class="" id="ALARM_CONT8">  </i>
                    <div class="col-lg-4" id="ALARM_NAME8">  </div>
                    <div class="col-lg-4" id="ALARM_TIMEON8" >  </div>
                    <div class="col-lg-4" id="ALARM_TIMEOFF8">  </div>
                </a>

                <code>EL boton D34 activa las alarmas</code>
            </div>
              
    
      <div class="container my-5">
      <!-- Connection -->
      <!--<div class="card">-->
        <div class="row g-5">
          <div class="col-md-12">
              <a class="block block-rounded block-link-pop bg-xinspire-darker" href="javascript:void(0)">
                  <div class="block-content block-content-full d-flex align-items-center justify-content-between">
                      <div class="me-3">
                      <p class="text-white text-uppercase fs-lg fw-semibold mb-0">
                          Control ON - OFF
                      </p>
                      <p class="text-white-75 mb-0">
                          Activa y Desactiva el puerto programado en sitio 
                      </p>
                      </div>
                      <div class="item">
                          <div class="form-check form-switch">
                              <!--<input class="form-check-input" type="checkbox" v-model="action.RELAY_STATUS" @click="relayOnOff">-->
                              <input class="form-check-input" type="checkbox" @click="relayOnOff33">
                          </div>
                      </div>
                      <div class="item">
                          <i :class="icon_class33"></i><!--"fa fa-3x fa-lightbulb text-warning"-->
                      </div>
                  </div>
              </a>
          </div>
        </div>
      <!--</div>-->
      </div>
    </main>
</template>

<script setup>
    
    // lo que este en la funcion useMqttService lo importara a este archivo
  import useMqttService from '@/composables/useMqttService';
  import { ref,computed } from 'vue'
  //import { useToast } from 'vue-toastification'
  const {
    qosList,
    connection,
    subscription,
    publish,
    client,
    receiveNews,
    receiveTopic,
    btnLoadingType,
    subscribeSuccess,
    createConnection,
    handleProtocolChange,
    destroyConnection,
    doSubscribe,
    doUnSubscribe,
    doPublish
    } = useMqttService()
    //v1/devices/lalo/ESPWROOM32A11B5AE04002/command //topico
    // {"protocol": "WS", "output": "RELAY D33", "value": false } //payload
    const relayOnOff33 = ()=>{
      // enviar dato de On Off por WS {"protocol": "WS", "output": "RELAY D33", "value": true }
      command(`{"value": ${!action.value.RELAY_STATUS33} }`)
      action.value.RELAY_STATUS33=!action.value.RELAY_STATUS33;
    }
    const icon_class33 = computed(() => {
        return action.value.RELAY_STATUS33 ? "fa fa-3x fa-check text-warning" : "fa fa-3x fa-check text-black"
    })

    const command = (cmd) => {
        client.value.publish(
          "v1/devices/lalo/ESPWROOM32A11B5AE04002/command", 
          cmd, 
            0, 
            (error)=>{
                btnLoadingType.value = ""
                if(error){
                    console.log("publish error:", error);

                    return
                }
                console.log(`published message: ${cmd}`)

            }
        )
    }
    const action = ref({
            RELAY_STATUS33: false
        })
</script>
