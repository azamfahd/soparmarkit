import{z as Rh,A as qi}from"./vendor-BzyA0McL.js";/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ph=()=>{};var Ba={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gu=function(n){const t=[];let e=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);s<128?t[e++]=s:s<2048?(t[e++]=s>>6|192,t[e++]=s&63|128):(s&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(s=65536+((s&1023)<<10)+(n.charCodeAt(++r)&1023),t[e++]=s>>18|240,t[e++]=s>>12&63|128,t[e++]=s>>6&63|128,t[e++]=s&63|128):(t[e++]=s>>12|224,t[e++]=s>>6&63|128,t[e++]=s&63|128)}return t},Sh=function(n){const t=[];let e=0,r=0;for(;e<n.length;){const s=n[e++];if(s<128)t[r++]=String.fromCharCode(s);else if(s>191&&s<224){const o=n[e++];t[r++]=String.fromCharCode((s&31)<<6|o&63)}else if(s>239&&s<365){const o=n[e++],a=n[e++],c=n[e++],h=((s&7)<<18|(o&63)<<12|(a&63)<<6|c&63)-65536;t[r++]=String.fromCharCode(55296+(h>>10)),t[r++]=String.fromCharCode(56320+(h&1023))}else{const o=n[e++],a=n[e++];t[r++]=String.fromCharCode((s&15)<<12|(o&63)<<6|a&63)}}return t.join("")},Hu={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,t){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const e=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let s=0;s<n.length;s+=3){const o=n[s],a=s+1<n.length,c=a?n[s+1]:0,h=s+2<n.length,f=h?n[s+2]:0,m=o>>2,p=(o&3)<<4|c>>4;let I=(c&15)<<2|f>>6,b=f&63;h||(b=64,a||(I=64)),r.push(e[m],e[p],e[I],e[b])}return r.join("")},encodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(n):this.encodeByteArray(Gu(n),t)},decodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(n):Sh(this.decodeStringToByteArray(n,t))},decodeStringToByteArray(n,t){this.init_();const e=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let s=0;s<n.length;){const o=e[n.charAt(s++)],c=s<n.length?e[n.charAt(s)]:0;++s;const f=s<n.length?e[n.charAt(s)]:64;++s;const p=s<n.length?e[n.charAt(s)]:64;if(++s,o==null||c==null||f==null||p==null)throw new Ch;const I=o<<2|c>>4;if(r.push(I),f!==64){const b=c<<4&240|f>>2;if(r.push(b),p!==64){const x=f<<6&192|p;r.push(x)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class Ch extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const bh=function(n){const t=Gu(n);return Hu.encodeByteArray(t,!0)},os=function(n){return bh(n).replace(/\./g,"")},xh=function(n){try{return Hu.decodeString(n,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Dh(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nh=()=>Dh().__FIREBASE_DEFAULTS__,kh=()=>{if(typeof process>"u"||typeof Ba>"u")return;const n=Ba.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Oh=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=n&&xh(n[1]);return t&&JSON.parse(t)},$i=()=>{try{return Ph()||Nh()||kh()||Oh()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Lh=n=>{var t,e;return(e=(t=$i())==null?void 0:t.emulatorHosts)==null?void 0:e[n]},Mh=n=>{const t=Lh(n);if(!t)return;const e=t.lastIndexOf(":");if(e<=0||e+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const r=parseInt(t.substring(e+1),10);return t[0]==="["?[t.substring(1,e-1),r]:[t.substring(0,e),r]},Qu=()=>{var n;return(n=$i())==null?void 0:n.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uh{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}wrapCallback(t){return(e,r)=>{e?this.reject(e):this.resolve(r),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(e):t(e,r))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fh(n,t){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const e={alg:"none",type:"JWT"},r=t||"demo-project",s=n.iat||0,o=n.sub||n.user_id;if(!o)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const a={iss:`https://securetoken.google.com/${r}`,aud:r,iat:s,exp:s+3600,auth_time:s,sub:o,user_id:o,firebase:{sign_in_provider:"custom",identities:{}},...n};return[os(JSON.stringify(e)),os(JSON.stringify(a)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Bh(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function qh(){var t;const n=(t=$i())==null?void 0:t.forceEnvironment;if(n==="node")return!0;if(n==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function $h(){return!qh()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function jh(){try{return typeof indexedDB=="object"}catch{return!1}}function zh(){return new Promise((n,t)=>{try{let e=!0;const r="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(r);s.onsuccess=()=>{s.result.close(),e||self.indexedDB.deleteDatabase(r),n(!0)},s.onupgradeneeded=()=>{e=!1},s.onerror=()=>{var o;t(((o=s.error)==null?void 0:o.message)||"")}}catch(e){t(e)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gh="FirebaseError";class En extends Error{constructor(t,e,r){super(e),this.code=t,this.customData=r,this.name=Gh,Object.setPrototypeOf(this,En.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Ku.prototype.create)}}class Ku{constructor(t,e,r){this.service=t,this.serviceName=e,this.errors=r}create(t,...e){const r=e[0]||{},s=`${this.service}/${t}`,o=this.errors[t],a=o?Hh(o,r):"Error",c=`${this.serviceName}: ${a} (${s}).`;return new En(s,c,r)}}function Hh(n,t){return n.replace(Qh,(e,r)=>{const s=t[r];return s!=null?String(s):`<${r}?>`})}const Qh=/\{\$([^}]+)}/g;function nr(n,t){if(n===t)return!0;const e=Object.keys(n),r=Object.keys(t);for(const s of e){if(!r.includes(s))return!1;const o=n[s],a=t[s];if(qa(o)&&qa(a)){if(!nr(o,a))return!1}else if(o!==a)return!1}for(const s of r)if(!e.includes(s))return!1;return!0}function qa(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ne(n){return n&&n._delegate?n._delegate:n}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ji(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Wu(n){return(await fetch(n,{credentials:"include"})).ok}class rr{constructor(t,e,r){this.name=t,this.instanceFactory=e,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $e="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kh{constructor(t,e){this.name=t,this.container=e,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const e=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(e)){const r=new Uh;if(this.instancesDeferred.set(e,r),this.isInitialized(e)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:e});s&&r.resolve(s)}catch{}}return this.instancesDeferred.get(e).promise}getImmediate(t){const e=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),r=(t==null?void 0:t.optional)??!1;if(this.isInitialized(e)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:e})}catch(s){if(r)return null;throw s}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(Yh(t))try{this.getOrInitializeService({instanceIdentifier:$e})}catch{}for(const[e,r]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(e);try{const o=this.getOrInitializeService({instanceIdentifier:s});r.resolve(o)}catch{}}}}clearInstance(t=$e){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(e=>"INTERNAL"in e).map(e=>e.INTERNAL.delete()),...t.filter(e=>"_delete"in e).map(e=>e._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=$e){return this.instances.has(t)}getOptions(t=$e){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:e={}}=t,r=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:r,options:e});for(const[o,a]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(o);r===c&&a.resolve(s)}return s}onInit(t,e){const r=this.normalizeInstanceIdentifier(e),s=this.onInitCallbacks.get(r)??new Set;s.add(t),this.onInitCallbacks.set(r,s);const o=this.instances.get(r);return o&&t(o,r),()=>{s.delete(t)}}invokeOnInitCallbacks(t,e){const r=this.onInitCallbacks.get(e);if(r)for(const s of r)try{s(t,e)}catch{}}getOrInitializeService({instanceIdentifier:t,options:e={}}){let r=this.instances.get(t);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:Wh(t),options:e}),this.instances.set(t,r),this.instancesOptions.set(t,e),this.invokeOnInitCallbacks(r,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,r)}catch{}return r||null}normalizeInstanceIdentifier(t=$e){return this.component?this.component.multipleInstances?t:$e:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Wh(n){return n===$e?void 0:n}function Yh(n){return n.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jh{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const e=this.getProvider(t.name);if(e.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);e.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const e=new Kh(t,this);return this.providers.set(t,e),e}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var W;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(W||(W={}));const Xh={debug:W.DEBUG,verbose:W.VERBOSE,info:W.INFO,warn:W.WARN,error:W.ERROR,silent:W.SILENT},Zh=W.INFO,tf={[W.DEBUG]:"log",[W.VERBOSE]:"log",[W.INFO]:"info",[W.WARN]:"warn",[W.ERROR]:"error"},ef=(n,t,...e)=>{if(t<n.logLevel)return;const r=new Date().toISOString(),s=tf[t];if(s)console[s](`[${r}]  ${n.name}:`,...e);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class Yu{constructor(t){this.name=t,this._logLevel=Zh,this._logHandler=ef,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in W))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?Xh[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,W.DEBUG,...t),this._logHandler(this,W.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,W.VERBOSE,...t),this._logHandler(this,W.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,W.INFO,...t),this._logHandler(this,W.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,W.WARN,...t),this._logHandler(this,W.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,W.ERROR,...t),this._logHandler(this,W.ERROR,...t)}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nf{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(rf(e)){const r=e.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(e=>e).join(" ")}}function rf(n){const t=n.getComponent();return(t==null?void 0:t.type)==="VERSION"}const Ti="@firebase/app",$a="0.15.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ue=new Yu("@firebase/app"),sf="@firebase/app-compat",of="@firebase/analytics-compat",af="@firebase/analytics",uf="@firebase/app-check-compat",cf="@firebase/app-check",lf="@firebase/auth",hf="@firebase/auth-compat",ff="@firebase/database",df="@firebase/data-connect",mf="@firebase/database-compat",pf="@firebase/functions",gf="@firebase/functions-compat",_f="@firebase/installations",yf="@firebase/installations-compat",Ef="@firebase/messaging",Tf="@firebase/messaging-compat",vf="@firebase/performance",wf="@firebase/performance-compat",If="@firebase/remote-config",Af="@firebase/remote-config-compat",Vf="@firebase/storage",Rf="@firebase/storage-compat",Pf="@firebase/firestore",Sf="@firebase/ai",Cf="@firebase/firestore-compat",bf="firebase",xf="12.15.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vi="[DEFAULT]",Df={[Ti]:"fire-core",[sf]:"fire-core-compat",[af]:"fire-analytics",[of]:"fire-analytics-compat",[cf]:"fire-app-check",[uf]:"fire-app-check-compat",[lf]:"fire-auth",[hf]:"fire-auth-compat",[ff]:"fire-rtdb",[df]:"fire-data-connect",[mf]:"fire-rtdb-compat",[pf]:"fire-fn",[gf]:"fire-fn-compat",[_f]:"fire-iid",[yf]:"fire-iid-compat",[Ef]:"fire-fcm",[Tf]:"fire-fcm-compat",[vf]:"fire-perf",[wf]:"fire-perf-compat",[If]:"fire-rc",[Af]:"fire-rc-compat",[Vf]:"fire-gcs",[Rf]:"fire-gcs-compat",[Pf]:"fire-fst",[Cf]:"fire-fst-compat",[Sf]:"fire-vertex","fire-js":"fire-js",[bf]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sr=new Map,Nf=new Map,wi=new Map;function ja(n,t){try{n.container.addComponent(t)}catch(e){ue.debug(`Component ${t.name} failed to register with FirebaseApp ${n.name}`,e)}}function as(n){const t=n.name;if(wi.has(t))return ue.debug(`There were multiple attempts to register component ${t}.`),!1;wi.set(t,n);for(const e of sr.values())ja(e,n);for(const e of Nf.values())ja(e,n);return!0}function Ju(n,t){const e=n.container.getProvider("heartbeat").getImmediate({optional:!0});return e&&e.triggerHeartbeat(),n.container.getProvider(t)}function kf(n){return n==null?!1:n.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Of={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},ye=new Ku("app","Firebase",Of);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lf{constructor(t,e,r){this._isDeleted=!1,this._options={...t},this._config={...e},this._name=e.name,this._automaticDataCollectionEnabled=e.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new rr("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw ye.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mf=xf;function Uf(n,t={}){let e=n;typeof t!="object"&&(t={name:t});const r={name:vi,automaticDataCollectionEnabled:!0,...t},s=r.name;if(typeof s!="string"||!s)throw ye.create("bad-app-name",{appName:String(s)});if(e||(e=Qu()),!e)throw ye.create("no-options");const o=sr.get(s);if(o){if(nr(e,o.options)&&nr(r,o.config))return o;throw ye.create("duplicate-app",{appName:s})}const a=new Jh(s);for(const h of wi.values())a.addComponent(h);const c=new Lf(e,r,a);return sr.set(s,c),c}function Ff(n=vi){const t=sr.get(n);if(!t&&n===vi&&Qu())return Uf();if(!t)throw ye.create("no-app",{appName:n});return t}function X_(){return Array.from(sr.values())}function un(n,t,e){let r=Df[n]??n;e&&(r+=`-${e}`);const s=r.match(/\s|\//),o=t.match(/\s|\//);if(s||o){const a=[`Unable to register library "${r}" with version "${t}":`];s&&a.push(`library name "${r}" contains illegal characters (whitespace or "/")`),s&&o&&a.push("and"),o&&a.push(`version name "${t}" contains illegal characters (whitespace or "/")`),ue.warn(a.join(" "));return}as(new rr(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bf="firebase-heartbeat-database",qf=1,ir="firebase-heartbeat-store";let fi=null;function Xu(){return fi||(fi=Rh(Bf,qf,{upgrade:(n,t)=>{switch(t){case 0:try{n.createObjectStore(ir)}catch(e){console.warn(e)}}}}).catch(n=>{throw ye.create("idb-open",{originalErrorMessage:n.message})})),fi}async function $f(n){try{const e=(await Xu()).transaction(ir),r=await e.objectStore(ir).get(Zu(n));return await e.done,r}catch(t){if(t instanceof En)ue.warn(t.message);else{const e=ye.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});ue.warn(e.message)}}}async function za(n,t){try{const r=(await Xu()).transaction(ir,"readwrite");await r.objectStore(ir).put(t,Zu(n)),await r.done}catch(e){if(e instanceof En)ue.warn(e.message);else{const r=ye.create("idb-set",{originalErrorMessage:e==null?void 0:e.message});ue.warn(r.message)}}}function Zu(n){return`${n.name}!${n.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jf=1024,zf=30;class Gf{constructor(t){this.container=t,this._heartbeatsCache=null;const e=this.container.getProvider("app").getImmediate();this._storage=new Qf(e),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var t,e;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=Ga();if(((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(a=>a.date===o))return;if(this._heartbeatsCache.heartbeats.push({date:o,agent:s}),this._heartbeatsCache.heartbeats.length>zf){const a=Kf(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(a,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){ue.warn(r)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const e=Ga(),{heartbeatsToSend:r,unsentEntries:s}=Hf(this._heartbeatsCache.heartbeats),o=os(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=e,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(e){return ue.warn(e),""}}}function Ga(){return new Date().toISOString().substring(0,10)}function Hf(n,t=jf){const e=[];let r=n.slice();for(const s of n){const o=e.find(a=>a.agent===s.agent);if(o){if(o.dates.push(s.date),Ha(e)>t){o.dates.pop();break}}else if(e.push({agent:s.agent,dates:[s.date]}),Ha(e)>t){e.pop();break}r=r.slice(1)}return{heartbeatsToSend:e,unsentEntries:r}}class Qf{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return jh()?zh().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const e=await $f(this.app);return e!=null&&e.heartbeats?e:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return za(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return za(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}}function Ha(n){return os(JSON.stringify({version:2,heartbeats:n})).length}function Kf(n){if(n.length===0)return-1;let t=0,e=n[0].date;for(let r=1;r<n.length;r++)n[r].date<e&&(e=n[r].date,t=r);return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wf(n){as(new rr("platform-logger",t=>new nf(t),"PRIVATE")),as(new rr("heartbeat",t=>new Gf(t),"PRIVATE")),un(Ti,$a,n),un(Ti,$a,"esm2020"),un("fire-js","")}Wf("");var Yf="firebase",Jf="12.15.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */un(Yf,Jf,"app");var Qa=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Ee,tc;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function t(v,g){function y(){}y.prototype=g.prototype,v.F=g.prototype,v.prototype=new y,v.prototype.constructor=v,v.D=function(w,T,V){for(var _=Array(arguments.length-2),bt=2;bt<arguments.length;bt++)_[bt-2]=arguments[bt];return g.prototype[T].apply(w,_)}}function e(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}t(r,e),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(v,g,y){y||(y=0);const w=Array(16);if(typeof g=="string")for(var T=0;T<16;++T)w[T]=g.charCodeAt(y++)|g.charCodeAt(y++)<<8|g.charCodeAt(y++)<<16|g.charCodeAt(y++)<<24;else for(T=0;T<16;++T)w[T]=g[y++]|g[y++]<<8|g[y++]<<16|g[y++]<<24;g=v.g[0],y=v.g[1],T=v.g[2];let V=v.g[3],_;_=g+(V^y&(T^V))+w[0]+3614090360&4294967295,g=y+(_<<7&4294967295|_>>>25),_=V+(T^g&(y^T))+w[1]+3905402710&4294967295,V=g+(_<<12&4294967295|_>>>20),_=T+(y^V&(g^y))+w[2]+606105819&4294967295,T=V+(_<<17&4294967295|_>>>15),_=y+(g^T&(V^g))+w[3]+3250441966&4294967295,y=T+(_<<22&4294967295|_>>>10),_=g+(V^y&(T^V))+w[4]+4118548399&4294967295,g=y+(_<<7&4294967295|_>>>25),_=V+(T^g&(y^T))+w[5]+1200080426&4294967295,V=g+(_<<12&4294967295|_>>>20),_=T+(y^V&(g^y))+w[6]+2821735955&4294967295,T=V+(_<<17&4294967295|_>>>15),_=y+(g^T&(V^g))+w[7]+4249261313&4294967295,y=T+(_<<22&4294967295|_>>>10),_=g+(V^y&(T^V))+w[8]+1770035416&4294967295,g=y+(_<<7&4294967295|_>>>25),_=V+(T^g&(y^T))+w[9]+2336552879&4294967295,V=g+(_<<12&4294967295|_>>>20),_=T+(y^V&(g^y))+w[10]+4294925233&4294967295,T=V+(_<<17&4294967295|_>>>15),_=y+(g^T&(V^g))+w[11]+2304563134&4294967295,y=T+(_<<22&4294967295|_>>>10),_=g+(V^y&(T^V))+w[12]+1804603682&4294967295,g=y+(_<<7&4294967295|_>>>25),_=V+(T^g&(y^T))+w[13]+4254626195&4294967295,V=g+(_<<12&4294967295|_>>>20),_=T+(y^V&(g^y))+w[14]+2792965006&4294967295,T=V+(_<<17&4294967295|_>>>15),_=y+(g^T&(V^g))+w[15]+1236535329&4294967295,y=T+(_<<22&4294967295|_>>>10),_=g+(T^V&(y^T))+w[1]+4129170786&4294967295,g=y+(_<<5&4294967295|_>>>27),_=V+(y^T&(g^y))+w[6]+3225465664&4294967295,V=g+(_<<9&4294967295|_>>>23),_=T+(g^y&(V^g))+w[11]+643717713&4294967295,T=V+(_<<14&4294967295|_>>>18),_=y+(V^g&(T^V))+w[0]+3921069994&4294967295,y=T+(_<<20&4294967295|_>>>12),_=g+(T^V&(y^T))+w[5]+3593408605&4294967295,g=y+(_<<5&4294967295|_>>>27),_=V+(y^T&(g^y))+w[10]+38016083&4294967295,V=g+(_<<9&4294967295|_>>>23),_=T+(g^y&(V^g))+w[15]+3634488961&4294967295,T=V+(_<<14&4294967295|_>>>18),_=y+(V^g&(T^V))+w[4]+3889429448&4294967295,y=T+(_<<20&4294967295|_>>>12),_=g+(T^V&(y^T))+w[9]+568446438&4294967295,g=y+(_<<5&4294967295|_>>>27),_=V+(y^T&(g^y))+w[14]+3275163606&4294967295,V=g+(_<<9&4294967295|_>>>23),_=T+(g^y&(V^g))+w[3]+4107603335&4294967295,T=V+(_<<14&4294967295|_>>>18),_=y+(V^g&(T^V))+w[8]+1163531501&4294967295,y=T+(_<<20&4294967295|_>>>12),_=g+(T^V&(y^T))+w[13]+2850285829&4294967295,g=y+(_<<5&4294967295|_>>>27),_=V+(y^T&(g^y))+w[2]+4243563512&4294967295,V=g+(_<<9&4294967295|_>>>23),_=T+(g^y&(V^g))+w[7]+1735328473&4294967295,T=V+(_<<14&4294967295|_>>>18),_=y+(V^g&(T^V))+w[12]+2368359562&4294967295,y=T+(_<<20&4294967295|_>>>12),_=g+(y^T^V)+w[5]+4294588738&4294967295,g=y+(_<<4&4294967295|_>>>28),_=V+(g^y^T)+w[8]+2272392833&4294967295,V=g+(_<<11&4294967295|_>>>21),_=T+(V^g^y)+w[11]+1839030562&4294967295,T=V+(_<<16&4294967295|_>>>16),_=y+(T^V^g)+w[14]+4259657740&4294967295,y=T+(_<<23&4294967295|_>>>9),_=g+(y^T^V)+w[1]+2763975236&4294967295,g=y+(_<<4&4294967295|_>>>28),_=V+(g^y^T)+w[4]+1272893353&4294967295,V=g+(_<<11&4294967295|_>>>21),_=T+(V^g^y)+w[7]+4139469664&4294967295,T=V+(_<<16&4294967295|_>>>16),_=y+(T^V^g)+w[10]+3200236656&4294967295,y=T+(_<<23&4294967295|_>>>9),_=g+(y^T^V)+w[13]+681279174&4294967295,g=y+(_<<4&4294967295|_>>>28),_=V+(g^y^T)+w[0]+3936430074&4294967295,V=g+(_<<11&4294967295|_>>>21),_=T+(V^g^y)+w[3]+3572445317&4294967295,T=V+(_<<16&4294967295|_>>>16),_=y+(T^V^g)+w[6]+76029189&4294967295,y=T+(_<<23&4294967295|_>>>9),_=g+(y^T^V)+w[9]+3654602809&4294967295,g=y+(_<<4&4294967295|_>>>28),_=V+(g^y^T)+w[12]+3873151461&4294967295,V=g+(_<<11&4294967295|_>>>21),_=T+(V^g^y)+w[15]+530742520&4294967295,T=V+(_<<16&4294967295|_>>>16),_=y+(T^V^g)+w[2]+3299628645&4294967295,y=T+(_<<23&4294967295|_>>>9),_=g+(T^(y|~V))+w[0]+4096336452&4294967295,g=y+(_<<6&4294967295|_>>>26),_=V+(y^(g|~T))+w[7]+1126891415&4294967295,V=g+(_<<10&4294967295|_>>>22),_=T+(g^(V|~y))+w[14]+2878612391&4294967295,T=V+(_<<15&4294967295|_>>>17),_=y+(V^(T|~g))+w[5]+4237533241&4294967295,y=T+(_<<21&4294967295|_>>>11),_=g+(T^(y|~V))+w[12]+1700485571&4294967295,g=y+(_<<6&4294967295|_>>>26),_=V+(y^(g|~T))+w[3]+2399980690&4294967295,V=g+(_<<10&4294967295|_>>>22),_=T+(g^(V|~y))+w[10]+4293915773&4294967295,T=V+(_<<15&4294967295|_>>>17),_=y+(V^(T|~g))+w[1]+2240044497&4294967295,y=T+(_<<21&4294967295|_>>>11),_=g+(T^(y|~V))+w[8]+1873313359&4294967295,g=y+(_<<6&4294967295|_>>>26),_=V+(y^(g|~T))+w[15]+4264355552&4294967295,V=g+(_<<10&4294967295|_>>>22),_=T+(g^(V|~y))+w[6]+2734768916&4294967295,T=V+(_<<15&4294967295|_>>>17),_=y+(V^(T|~g))+w[13]+1309151649&4294967295,y=T+(_<<21&4294967295|_>>>11),_=g+(T^(y|~V))+w[4]+4149444226&4294967295,g=y+(_<<6&4294967295|_>>>26),_=V+(y^(g|~T))+w[11]+3174756917&4294967295,V=g+(_<<10&4294967295|_>>>22),_=T+(g^(V|~y))+w[2]+718787259&4294967295,T=V+(_<<15&4294967295|_>>>17),_=y+(V^(T|~g))+w[9]+3951481745&4294967295,v.g[0]=v.g[0]+g&4294967295,v.g[1]=v.g[1]+(T+(_<<21&4294967295|_>>>11))&4294967295,v.g[2]=v.g[2]+T&4294967295,v.g[3]=v.g[3]+V&4294967295}r.prototype.v=function(v,g){g===void 0&&(g=v.length);const y=g-this.blockSize,w=this.C;let T=this.h,V=0;for(;V<g;){if(T==0)for(;V<=y;)s(this,v,V),V+=this.blockSize;if(typeof v=="string"){for(;V<g;)if(w[T++]=v.charCodeAt(V++),T==this.blockSize){s(this,w),T=0;break}}else for(;V<g;)if(w[T++]=v[V++],T==this.blockSize){s(this,w),T=0;break}}this.h=T,this.o+=g},r.prototype.A=function(){var v=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);v[0]=128;for(var g=1;g<v.length-8;++g)v[g]=0;g=this.o*8;for(var y=v.length-8;y<v.length;++y)v[y]=g&255,g/=256;for(this.v(v),v=Array(16),g=0,y=0;y<4;++y)for(let w=0;w<32;w+=8)v[g++]=this.g[y]>>>w&255;return v};function o(v,g){var y=c;return Object.prototype.hasOwnProperty.call(y,v)?y[v]:y[v]=g(v)}function a(v,g){this.h=g;const y=[];let w=!0;for(let T=v.length-1;T>=0;T--){const V=v[T]|0;w&&V==g||(y[T]=V,w=!1)}this.g=y}var c={};function h(v){return-128<=v&&v<128?o(v,function(g){return new a([g|0],g<0?-1:0)}):new a([v|0],v<0?-1:0)}function f(v){if(isNaN(v)||!isFinite(v))return p;if(v<0)return L(f(-v));const g=[];let y=1;for(let w=0;v>=y;w++)g[w]=v/y|0,y*=4294967296;return new a(g,0)}function m(v,g){if(v.length==0)throw Error("number format error: empty string");if(g=g||10,g<2||36<g)throw Error("radix out of range: "+g);if(v.charAt(0)=="-")return L(m(v.substring(1),g));if(v.indexOf("-")>=0)throw Error('number format error: interior "-" character');const y=f(Math.pow(g,8));let w=p;for(let V=0;V<v.length;V+=8){var T=Math.min(8,v.length-V);const _=parseInt(v.substring(V,V+T),g);T<8?(T=f(Math.pow(g,T)),w=w.j(T).add(f(_))):(w=w.j(y),w=w.add(f(_)))}return w}var p=h(0),I=h(1),b=h(16777216);n=a.prototype,n.m=function(){if(U(this))return-L(this).m();let v=0,g=1;for(let y=0;y<this.g.length;y++){const w=this.i(y);v+=(w>=0?w:4294967296+w)*g,g*=4294967296}return v},n.toString=function(v){if(v=v||10,v<2||36<v)throw Error("radix out of range: "+v);if(x(this))return"0";if(U(this))return"-"+L(this).toString(v);const g=f(Math.pow(v,6));var y=this;let w="";for(;;){const T=jt(y,g).g;y=Q(y,T.j(g));let V=((y.g.length>0?y.g[0]:y.h)>>>0).toString(v);if(y=T,x(y))return V+w;for(;V.length<6;)V="0"+V;w=V+w}},n.i=function(v){return v<0?0:v<this.g.length?this.g[v]:this.h};function x(v){if(v.h!=0)return!1;for(let g=0;g<v.g.length;g++)if(v.g[g]!=0)return!1;return!0}function U(v){return v.h==-1}n.l=function(v){return v=Q(this,v),U(v)?-1:x(v)?0:1};function L(v){const g=v.g.length,y=[];for(let w=0;w<g;w++)y[w]=~v.g[w];return new a(y,~v.h).add(I)}n.abs=function(){return U(this)?L(this):this},n.add=function(v){const g=Math.max(this.g.length,v.g.length),y=[];let w=0;for(let T=0;T<=g;T++){let V=w+(this.i(T)&65535)+(v.i(T)&65535),_=(V>>>16)+(this.i(T)>>>16)+(v.i(T)>>>16);w=_>>>16,V&=65535,_&=65535,y[T]=_<<16|V}return new a(y,y[y.length-1]&-2147483648?-1:0)};function Q(v,g){return v.add(L(g))}n.j=function(v){if(x(this)||x(v))return p;if(U(this))return U(v)?L(this).j(L(v)):L(L(this).j(v));if(U(v))return L(this.j(L(v)));if(this.l(b)<0&&v.l(b)<0)return f(this.m()*v.m());const g=this.g.length+v.g.length,y=[];for(var w=0;w<2*g;w++)y[w]=0;for(w=0;w<this.g.length;w++)for(let T=0;T<v.g.length;T++){const V=this.i(w)>>>16,_=this.i(w)&65535,bt=v.i(T)>>>16,Le=v.i(T)&65535;y[2*w+2*T]+=_*Le,J(y,2*w+2*T),y[2*w+2*T+1]+=V*Le,J(y,2*w+2*T+1),y[2*w+2*T+1]+=_*bt,J(y,2*w+2*T+1),y[2*w+2*T+2]+=V*bt,J(y,2*w+2*T+2)}for(v=0;v<g;v++)y[v]=y[2*v+1]<<16|y[2*v];for(v=g;v<2*g;v++)y[v]=0;return new a(y,0)};function J(v,g){for(;(v[g]&65535)!=v[g];)v[g+1]+=v[g]>>>16,v[g]&=65535,g++}function rt(v,g){this.g=v,this.h=g}function jt(v,g){if(x(g))throw Error("division by zero");if(x(v))return new rt(p,p);if(U(v))return g=jt(L(v),g),new rt(L(g.g),L(g.h));if(U(g))return g=jt(v,L(g)),new rt(L(g.g),g.h);if(v.g.length>30){if(U(v)||U(g))throw Error("slowDivide_ only works with positive integers.");for(var y=I,w=g;w.l(v)<=0;)y=Tt(y),w=Tt(w);var T=vt(y,1),V=vt(w,1);for(w=vt(w,2),y=vt(y,2);!x(w);){var _=V.add(w);_.l(v)<=0&&(T=T.add(y),V=_),w=vt(w,1),y=vt(y,1)}return g=Q(v,T.j(g)),new rt(T,g)}for(T=p;v.l(g)>=0;){for(y=Math.max(1,Math.floor(v.m()/g.m())),w=Math.ceil(Math.log(y)/Math.LN2),w=w<=48?1:Math.pow(2,w-48),V=f(y),_=V.j(g);U(_)||_.l(v)>0;)y-=w,V=f(y),_=V.j(g);x(V)&&(V=I),T=T.add(V),v=Q(v,_)}return new rt(T,v)}n.B=function(v){return jt(this,v).h},n.and=function(v){const g=Math.max(this.g.length,v.g.length),y=[];for(let w=0;w<g;w++)y[w]=this.i(w)&v.i(w);return new a(y,this.h&v.h)},n.or=function(v){const g=Math.max(this.g.length,v.g.length),y=[];for(let w=0;w<g;w++)y[w]=this.i(w)|v.i(w);return new a(y,this.h|v.h)},n.xor=function(v){const g=Math.max(this.g.length,v.g.length),y=[];for(let w=0;w<g;w++)y[w]=this.i(w)^v.i(w);return new a(y,this.h^v.h)};function Tt(v){const g=v.g.length+1,y=[];for(let w=0;w<g;w++)y[w]=v.i(w)<<1|v.i(w-1)>>>31;return new a(y,v.h)}function vt(v,g){const y=g>>5;g%=32;const w=v.g.length-y,T=[];for(let V=0;V<w;V++)T[V]=g>0?v.i(V+y)>>>g|v.i(V+y+1)<<32-g:v.i(V+y);return new a(T,v.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,tc=r,a.prototype.add=a.prototype.add,a.prototype.multiply=a.prototype.j,a.prototype.modulo=a.prototype.B,a.prototype.compare=a.prototype.l,a.prototype.toNumber=a.prototype.m,a.prototype.toString=a.prototype.toString,a.prototype.getBits=a.prototype.i,a.fromNumber=f,a.fromString=m,Ee=a}).apply(typeof Qa<"u"?Qa:typeof self<"u"?self:typeof window<"u"?window:{});var Kr=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var ec,Hn,nc,ts,Ii,rc,sc,ic;(function(){var n,t=Object.defineProperty;function e(i){i=[typeof globalThis=="object"&&globalThis,i,typeof window=="object"&&window,typeof self=="object"&&self,typeof Kr=="object"&&Kr];for(var u=0;u<i.length;++u){var l=i[u];if(l&&l.Math==Math)return l}throw Error("Cannot find global object")}var r=e(this);function s(i,u){if(u)t:{var l=r;i=i.split(".");for(var d=0;d<i.length-1;d++){var A=i[d];if(!(A in l))break t;l=l[A]}i=i[i.length-1],d=l[i],u=u(d),u!=d&&u!=null&&t(l,i,{configurable:!0,writable:!0,value:u})}}s("Symbol.dispose",function(i){return i||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(i){return i||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(i){return i||function(u){var l=[],d;for(d in u)Object.prototype.hasOwnProperty.call(u,d)&&l.push([d,u[d]]);return l}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var o=o||{},a=this||self;function c(i){var u=typeof i;return u=="object"&&i!=null||u=="function"}function h(i,u,l){return i.call.apply(i.bind,arguments)}function f(i,u,l){return f=h,f.apply(null,arguments)}function m(i,u){var l=Array.prototype.slice.call(arguments,1);return function(){var d=l.slice();return d.push.apply(d,arguments),i.apply(this,d)}}function p(i,u){function l(){}l.prototype=u.prototype,i.Z=u.prototype,i.prototype=new l,i.prototype.constructor=i,i.Ob=function(d,A,R){for(var N=Array(arguments.length-2),z=2;z<arguments.length;z++)N[z-2]=arguments[z];return u.prototype[A].apply(d,N)}}var I=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?i=>i&&AsyncContext.Snapshot.wrap(i):i=>i;function b(i){const u=i.length;if(u>0){const l=Array(u);for(let d=0;d<u;d++)l[d]=i[d];return l}return[]}function x(i,u){for(let d=1;d<arguments.length;d++){const A=arguments[d];var l=typeof A;if(l=l!="object"?l:A?Array.isArray(A)?"array":l:"null",l=="array"||l=="object"&&typeof A.length=="number"){l=i.length||0;const R=A.length||0;i.length=l+R;for(let N=0;N<R;N++)i[l+N]=A[N]}else i.push(A)}}class U{constructor(u,l){this.i=u,this.j=l,this.h=0,this.g=null}get(){let u;return this.h>0?(this.h--,u=this.g,this.g=u.next,u.next=null):u=this.i(),u}}function L(i){a.setTimeout(()=>{throw i},0)}function Q(){var i=v;let u=null;return i.g&&(u=i.g,i.g=i.g.next,i.g||(i.h=null),u.next=null),u}class J{constructor(){this.h=this.g=null}add(u,l){const d=rt.get();d.set(u,l),this.h?this.h.next=d:this.g=d,this.h=d}}var rt=new U(()=>new jt,i=>i.reset());class jt{constructor(){this.next=this.g=this.h=null}set(u,l){this.h=u,this.g=l,this.next=null}reset(){this.next=this.g=this.h=null}}let Tt,vt=!1,v=new J,g=()=>{const i=Promise.resolve(void 0);Tt=()=>{i.then(y)}};function y(){for(var i;i=Q();){try{i.h.call(i.g)}catch(l){L(l)}var u=rt;u.j(i),u.h<100&&(u.h++,i.next=u.g,u.g=i)}vt=!1}function w(){this.u=this.u,this.C=this.C}w.prototype.u=!1,w.prototype.dispose=function(){this.u||(this.u=!0,this.N())},w.prototype[Symbol.dispose]=function(){this.dispose()},w.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function T(i,u){this.type=i,this.g=this.target=u,this.defaultPrevented=!1}T.prototype.h=function(){this.defaultPrevented=!0};var V=(function(){if(!a.addEventListener||!Object.defineProperty)return!1;var i=!1,u=Object.defineProperty({},"passive",{get:function(){i=!0}});try{const l=()=>{};a.addEventListener("test",l,u),a.removeEventListener("test",l,u)}catch{}return i})();function _(i){return/^[\s\xa0]*$/.test(i)}function bt(i,u){T.call(this,i?i.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,i&&this.init(i,u)}p(bt,T),bt.prototype.init=function(i,u){const l=this.type=i.type,d=i.changedTouches&&i.changedTouches.length?i.changedTouches[0]:null;this.target=i.target||i.srcElement,this.g=u,u=i.relatedTarget,u||(l=="mouseover"?u=i.fromElement:l=="mouseout"&&(u=i.toElement)),this.relatedTarget=u,d?(this.clientX=d.clientX!==void 0?d.clientX:d.pageX,this.clientY=d.clientY!==void 0?d.clientY:d.pageY,this.screenX=d.screenX||0,this.screenY=d.screenY||0):(this.clientX=i.clientX!==void 0?i.clientX:i.pageX,this.clientY=i.clientY!==void 0?i.clientY:i.pageY,this.screenX=i.screenX||0,this.screenY=i.screenY||0),this.button=i.button,this.key=i.key||"",this.ctrlKey=i.ctrlKey,this.altKey=i.altKey,this.shiftKey=i.shiftKey,this.metaKey=i.metaKey,this.pointerId=i.pointerId||0,this.pointerType=i.pointerType,this.state=i.state,this.i=i,i.defaultPrevented&&bt.Z.h.call(this)},bt.prototype.h=function(){bt.Z.h.call(this);const i=this.i;i.preventDefault?i.preventDefault():i.returnValue=!1};var Le="closure_listenable_"+(Math.random()*1e6|0),Kl=0;function Wl(i,u,l,d,A){this.listener=i,this.proxy=null,this.src=u,this.type=l,this.capture=!!d,this.ha=A,this.key=++Kl,this.da=this.fa=!1}function Nr(i){i.da=!0,i.listener=null,i.proxy=null,i.src=null,i.ha=null}function kr(i,u,l){for(const d in i)u.call(l,i[d],d,i)}function Yl(i,u){for(const l in i)u.call(void 0,i[l],l,i)}function Fo(i){const u={};for(const l in i)u[l]=i[l];return u}const Bo="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function qo(i,u){let l,d;for(let A=1;A<arguments.length;A++){d=arguments[A];for(l in d)i[l]=d[l];for(let R=0;R<Bo.length;R++)l=Bo[R],Object.prototype.hasOwnProperty.call(d,l)&&(i[l]=d[l])}}function Or(i){this.src=i,this.g={},this.h=0}Or.prototype.add=function(i,u,l,d,A){const R=i.toString();i=this.g[R],i||(i=this.g[R]=[],this.h++);const N=js(i,u,d,A);return N>-1?(u=i[N],l||(u.fa=!1)):(u=new Wl(u,this.src,R,!!d,A),u.fa=l,i.push(u)),u};function $s(i,u){const l=u.type;if(l in i.g){var d=i.g[l],A=Array.prototype.indexOf.call(d,u,void 0),R;(R=A>=0)&&Array.prototype.splice.call(d,A,1),R&&(Nr(u),i.g[l].length==0&&(delete i.g[l],i.h--))}}function js(i,u,l,d){for(let A=0;A<i.length;++A){const R=i[A];if(!R.da&&R.listener==u&&R.capture==!!l&&R.ha==d)return A}return-1}var zs="closure_lm_"+(Math.random()*1e6|0),Gs={};function $o(i,u,l,d,A){if(Array.isArray(u)){for(let R=0;R<u.length;R++)$o(i,u[R],l,d,A);return null}return l=Go(l),i&&i[Le]?i.J(u,l,c(d)?!!d.capture:!1,A):Jl(i,u,l,!1,d,A)}function Jl(i,u,l,d,A,R){if(!u)throw Error("Invalid event type");const N=c(A)?!!A.capture:!!A;let z=Qs(i);if(z||(i[zs]=z=new Or(i)),l=z.add(u,l,d,N,R),l.proxy)return l;if(d=Xl(),l.proxy=d,d.src=i,d.listener=l,i.addEventListener)V||(A=N),A===void 0&&(A=!1),i.addEventListener(u.toString(),d,A);else if(i.attachEvent)i.attachEvent(zo(u.toString()),d);else if(i.addListener&&i.removeListener)i.addListener(d);else throw Error("addEventListener and attachEvent are unavailable.");return l}function Xl(){function i(l){return u.call(i.src,i.listener,l)}const u=Zl;return i}function jo(i,u,l,d,A){if(Array.isArray(u))for(var R=0;R<u.length;R++)jo(i,u[R],l,d,A);else d=c(d)?!!d.capture:!!d,l=Go(l),i&&i[Le]?(i=i.i,R=String(u).toString(),R in i.g&&(u=i.g[R],l=js(u,l,d,A),l>-1&&(Nr(u[l]),Array.prototype.splice.call(u,l,1),u.length==0&&(delete i.g[R],i.h--)))):i&&(i=Qs(i))&&(u=i.g[u.toString()],i=-1,u&&(i=js(u,l,d,A)),(l=i>-1?u[i]:null)&&Hs(l))}function Hs(i){if(typeof i!="number"&&i&&!i.da){var u=i.src;if(u&&u[Le])$s(u.i,i);else{var l=i.type,d=i.proxy;u.removeEventListener?u.removeEventListener(l,d,i.capture):u.detachEvent?u.detachEvent(zo(l),d):u.addListener&&u.removeListener&&u.removeListener(d),(l=Qs(u))?($s(l,i),l.h==0&&(l.src=null,u[zs]=null)):Nr(i)}}}function zo(i){return i in Gs?Gs[i]:Gs[i]="on"+i}function Zl(i,u){if(i.da)i=!0;else{u=new bt(u,this);const l=i.listener,d=i.ha||i.src;i.fa&&Hs(i),i=l.call(d,u)}return i}function Qs(i){return i=i[zs],i instanceof Or?i:null}var Ks="__closure_events_fn_"+(Math.random()*1e9>>>0);function Go(i){return typeof i=="function"?i:(i[Ks]||(i[Ks]=function(u){return i.handleEvent(u)}),i[Ks])}function wt(){w.call(this),this.i=new Or(this),this.M=this,this.G=null}p(wt,w),wt.prototype[Le]=!0,wt.prototype.removeEventListener=function(i,u,l,d){jo(this,i,u,l,d)};function Pt(i,u){var l,d=i.G;if(d)for(l=[];d;d=d.G)l.push(d);if(i=i.M,d=u.type||u,typeof u=="string")u=new T(u,i);else if(u instanceof T)u.target=u.target||i;else{var A=u;u=new T(d,i),qo(u,A)}A=!0;let R,N;if(l)for(N=l.length-1;N>=0;N--)R=u.g=l[N],A=Lr(R,d,!0,u)&&A;if(R=u.g=i,A=Lr(R,d,!0,u)&&A,A=Lr(R,d,!1,u)&&A,l)for(N=0;N<l.length;N++)R=u.g=l[N],A=Lr(R,d,!1,u)&&A}wt.prototype.N=function(){if(wt.Z.N.call(this),this.i){var i=this.i;for(const u in i.g){const l=i.g[u];for(let d=0;d<l.length;d++)Nr(l[d]);delete i.g[u],i.h--}}this.G=null},wt.prototype.J=function(i,u,l,d){return this.i.add(String(i),u,!1,l,d)},wt.prototype.K=function(i,u,l,d){return this.i.add(String(i),u,!0,l,d)};function Lr(i,u,l,d){if(u=i.i.g[String(u)],!u)return!0;u=u.concat();let A=!0;for(let R=0;R<u.length;++R){const N=u[R];if(N&&!N.da&&N.capture==l){const z=N.listener,ft=N.ha||N.src;N.fa&&$s(i.i,N),A=z.call(ft,d)!==!1&&A}}return A&&!d.defaultPrevented}function th(i,u){if(typeof i!="function")if(i&&typeof i.handleEvent=="function")i=f(i.handleEvent,i);else throw Error("Invalid listener argument");return Number(u)>2147483647?-1:a.setTimeout(i,u||0)}function Ho(i){i.g=th(()=>{i.g=null,i.i&&(i.i=!1,Ho(i))},i.l);const u=i.h;i.h=null,i.m.apply(null,u)}class eh extends w{constructor(u,l){super(),this.m=u,this.l=l,this.h=null,this.i=!1,this.g=null}j(u){this.h=arguments,this.g?this.i=!0:Ho(this)}N(){super.N(),this.g&&(a.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Sn(i){w.call(this),this.h=i,this.g={}}p(Sn,w);var Qo=[];function Ko(i){kr(i.g,function(u,l){this.g.hasOwnProperty(l)&&Hs(u)},i),i.g={}}Sn.prototype.N=function(){Sn.Z.N.call(this),Ko(this)},Sn.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Ws=a.JSON.stringify,nh=a.JSON.parse,rh=class{stringify(i){return a.JSON.stringify(i,void 0)}parse(i){return a.JSON.parse(i,void 0)}};function Wo(){}function Yo(){}var Cn={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Ys(){T.call(this,"d")}p(Ys,T);function Js(){T.call(this,"c")}p(Js,T);var Me={},Jo=null;function Mr(){return Jo=Jo||new wt}Me.Ia="serverreachability";function Xo(i){T.call(this,Me.Ia,i)}p(Xo,T);function bn(i){const u=Mr();Pt(u,new Xo(u))}Me.STAT_EVENT="statevent";function Zo(i,u){T.call(this,Me.STAT_EVENT,i),this.stat=u}p(Zo,T);function St(i){const u=Mr();Pt(u,new Zo(u,i))}Me.Ja="timingevent";function ta(i,u){T.call(this,Me.Ja,i),this.size=u}p(ta,T);function xn(i,u){if(typeof i!="function")throw Error("Fn must not be null and must be a function");return a.setTimeout(function(){i()},u)}function Dn(){this.g=!0}Dn.prototype.ua=function(){this.g=!1};function sh(i,u,l,d,A,R){i.info(function(){if(i.g)if(R){var N="",z=R.split("&");for(let X=0;X<z.length;X++){var ft=z[X].split("=");if(ft.length>1){const pt=ft[0];ft=ft[1];const Yt=pt.split("_");N=Yt.length>=2&&Yt[1]=="type"?N+(pt+"="+ft+"&"):N+(pt+"=redacted&")}}}else N=null;else N=R;return"XMLHTTP REQ ("+d+") [attempt "+A+"]: "+u+`
`+l+`
`+N})}function ih(i,u,l,d,A,R,N){i.info(function(){return"XMLHTTP RESP ("+d+") [ attempt "+A+"]: "+u+`
`+l+`
`+R+" "+N})}function tn(i,u,l,d){i.info(function(){return"XMLHTTP TEXT ("+u+"): "+ah(i,l)+(d?" "+d:"")})}function oh(i,u){i.info(function(){return"TIMEOUT: "+u})}Dn.prototype.info=function(){};function ah(i,u){if(!i.g)return u;if(!u)return null;try{const R=JSON.parse(u);if(R){for(i=0;i<R.length;i++)if(Array.isArray(R[i])){var l=R[i];if(!(l.length<2)){var d=l[1];if(Array.isArray(d)&&!(d.length<1)){var A=d[0];if(A!="noop"&&A!="stop"&&A!="close")for(let N=1;N<d.length;N++)d[N]=""}}}}return Ws(R)}catch{return u}}var Ur={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},ea={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},na;function Xs(){}p(Xs,Wo),Xs.prototype.g=function(){return new XMLHttpRequest},na=new Xs;function Nn(i){return encodeURIComponent(String(i))}function uh(i){var u=1;i=i.split(":");const l=[];for(;u>0&&i.length;)l.push(i.shift()),u--;return i.length&&l.push(i.join(":")),l}function he(i,u,l,d){this.j=i,this.i=u,this.l=l,this.S=d||1,this.V=new Sn(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new ra}function ra(){this.i=null,this.g="",this.h=!1}var sa={},Zs={};function ti(i,u,l){i.M=1,i.A=Br(Wt(u)),i.u=l,i.R=!0,ia(i,null)}function ia(i,u){i.F=Date.now(),Fr(i),i.B=Wt(i.A);var l=i.B,d=i.S;Array.isArray(d)||(d=[String(d)]),ya(l.i,"t",d),i.C=0,l=i.j.L,i.h=new ra,i.g=La(i.j,l?u:null,!i.u),i.P>0&&(i.O=new eh(f(i.Y,i,i.g),i.P)),u=i.V,l=i.g,d=i.ba;var A="readystatechange";Array.isArray(A)||(A&&(Qo[0]=A.toString()),A=Qo);for(let R=0;R<A.length;R++){const N=$o(l,A[R],d||u.handleEvent,!1,u.h||u);if(!N)break;u.g[N.key]=N}u=i.J?Fo(i.J):{},i.u?(i.v||(i.v="POST"),u["Content-Type"]="application/x-www-form-urlencoded",i.g.ea(i.B,i.v,i.u,u)):(i.v="GET",i.g.ea(i.B,i.v,null,u)),bn(),sh(i.i,i.v,i.B,i.l,i.S,i.u)}he.prototype.ba=function(i){i=i.target;const u=this.O;u&&me(i)==3?u.j():this.Y(i)},he.prototype.Y=function(i){try{if(i==this.g)t:{const z=me(this.g),ft=this.g.ya(),X=this.g.ca();if(!(z<3)&&(z!=3||this.g&&(this.h.h||this.g.la()||Va(this.g)))){this.K||z!=4||ft==7||(ft==8||X<=0?bn(3):bn(2)),ei(this);var u=this.g.ca();this.X=u;var l=ch(this);if(this.o=u==200,ih(this.i,this.v,this.B,this.l,this.S,z,u),this.o){if(this.U&&!this.L){e:{if(this.g){var d,A=this.g;if((d=A.g?A.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!_(d)){var R=d;break e}}R=null}if(i=R)tn(this.i,this.l,i,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,ni(this,i);else{this.o=!1,this.m=3,St(12),Ue(this),kn(this);break t}}if(this.R){i=!0;let pt;for(;!this.K&&this.C<l.length;)if(pt=lh(this,l),pt==Zs){z==4&&(this.m=4,St(14),i=!1),tn(this.i,this.l,null,"[Incomplete Response]");break}else if(pt==sa){this.m=4,St(15),tn(this.i,this.l,l,"[Invalid Chunk]"),i=!1;break}else tn(this.i,this.l,pt,null),ni(this,pt);if(oa(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),z!=4||l.length!=0||this.h.h||(this.m=1,St(16),i=!1),this.o=this.o&&i,!i)tn(this.i,this.l,l,"[Invalid Chunked Response]"),Ue(this),kn(this);else if(l.length>0&&!this.W){this.W=!0;var N=this.j;N.g==this&&N.aa&&!N.P&&(N.j.info("Great, no buffering proxy detected. Bytes received: "+l.length),li(N),N.P=!0,St(11))}}else tn(this.i,this.l,l,null),ni(this,l);z==4&&Ue(this),this.o&&!this.K&&(z==4?Da(this.j,this):(this.o=!1,Fr(this)))}else Ah(this.g),u==400&&l.indexOf("Unknown SID")>0?(this.m=3,St(12)):(this.m=0,St(13)),Ue(this),kn(this)}}}catch{}finally{}};function ch(i){if(!oa(i))return i.g.la();const u=Va(i.g);if(u==="")return"";let l="";const d=u.length,A=me(i.g)==4;if(!i.h.i){if(typeof TextDecoder>"u")return Ue(i),kn(i),"";i.h.i=new a.TextDecoder}for(let R=0;R<d;R++)i.h.h=!0,l+=i.h.i.decode(u[R],{stream:!(A&&R==d-1)});return u.length=0,i.h.g+=l,i.C=0,i.h.g}function oa(i){return i.g?i.v=="GET"&&i.M!=2&&i.j.Aa:!1}function lh(i,u){var l=i.C,d=u.indexOf(`
`,l);return d==-1?Zs:(l=Number(u.substring(l,d)),isNaN(l)?sa:(d+=1,d+l>u.length?Zs:(u=u.slice(d,d+l),i.C=d+l,u)))}he.prototype.cancel=function(){this.K=!0,Ue(this)};function Fr(i){i.T=Date.now()+i.H,aa(i,i.H)}function aa(i,u){if(i.D!=null)throw Error("WatchDog timer not null");i.D=xn(f(i.aa,i),u)}function ei(i){i.D&&(a.clearTimeout(i.D),i.D=null)}he.prototype.aa=function(){this.D=null;const i=Date.now();i-this.T>=0?(oh(this.i,this.B),this.M!=2&&(bn(),St(17)),Ue(this),this.m=2,kn(this)):aa(this,this.T-i)};function kn(i){i.j.I==0||i.K||Da(i.j,i)}function Ue(i){ei(i);var u=i.O;u&&typeof u.dispose=="function"&&u.dispose(),i.O=null,Ko(i.V),i.g&&(u=i.g,i.g=null,u.abort(),u.dispose())}function ni(i,u){try{var l=i.j;if(l.I!=0&&(l.g==i||ri(l.h,i))){if(!i.L&&ri(l.h,i)&&l.I==3){try{var d=l.Ba.g.parse(u)}catch{d=null}if(Array.isArray(d)&&d.length==3){var A=d;if(A[0]==0){t:if(!l.v){if(l.g)if(l.g.F+3e3<i.F)Gr(l),jr(l);else break t;ci(l),St(18)}}else l.xa=A[1],0<l.xa-l.K&&A[2]<37500&&l.F&&l.A==0&&!l.C&&(l.C=xn(f(l.Va,l),6e3));la(l.h)<=1&&l.ta&&(l.ta=void 0)}else Be(l,11)}else if((i.L||l.g==i)&&Gr(l),!_(u))for(A=l.Ba.g.parse(u),u=0;u<A.length;u++){let X=A[u];const pt=X[0];if(!(pt<=l.K))if(l.K=pt,X=X[1],l.I==2)if(X[0]=="c"){l.M=X[1],l.ba=X[2];const Yt=X[3];Yt!=null&&(l.ka=Yt,l.j.info("VER="+l.ka));const qe=X[4];qe!=null&&(l.za=qe,l.j.info("SVER="+l.za));const pe=X[5];pe!=null&&typeof pe=="number"&&pe>0&&(d=1.5*pe,l.O=d,l.j.info("backChannelRequestTimeoutMs_="+d)),d=l;const ge=i.g;if(ge){const Qr=ge.g?ge.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Qr){var R=d.h;R.g||Qr.indexOf("spdy")==-1&&Qr.indexOf("quic")==-1&&Qr.indexOf("h2")==-1||(R.j=R.l,R.g=new Set,R.h&&(si(R,R.h),R.h=null))}if(d.G){const hi=ge.g?ge.g.getResponseHeader("X-HTTP-Session-Id"):null;hi&&(d.wa=hi,Z(d.J,d.G,hi))}}l.I=3,l.l&&l.l.ra(),l.aa&&(l.T=Date.now()-i.F,l.j.info("Handshake RTT: "+l.T+"ms")),d=l;var N=i;if(d.na=Oa(d,d.L?d.ba:null,d.W),N.L){ha(d.h,N);var z=N,ft=d.O;ft&&(z.H=ft),z.D&&(ei(z),Fr(z)),d.g=N}else ba(d);l.i.length>0&&zr(l)}else X[0]!="stop"&&X[0]!="close"||Be(l,7);else l.I==3&&(X[0]=="stop"||X[0]=="close"?X[0]=="stop"?Be(l,7):ui(l):X[0]!="noop"&&l.l&&l.l.qa(X),l.A=0)}}bn(4)}catch{}}var hh=class{constructor(i,u){this.g=i,this.map=u}};function ua(i){this.l=i||10,a.PerformanceNavigationTiming?(i=a.performance.getEntriesByType("navigation"),i=i.length>0&&(i[0].nextHopProtocol=="hq"||i[0].nextHopProtocol=="h2")):i=!!(a.chrome&&a.chrome.loadTimes&&a.chrome.loadTimes()&&a.chrome.loadTimes().wasFetchedViaSpdy),this.j=i?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function ca(i){return i.h?!0:i.g?i.g.size>=i.j:!1}function la(i){return i.h?1:i.g?i.g.size:0}function ri(i,u){return i.h?i.h==u:i.g?i.g.has(u):!1}function si(i,u){i.g?i.g.add(u):i.h=u}function ha(i,u){i.h&&i.h==u?i.h=null:i.g&&i.g.has(u)&&i.g.delete(u)}ua.prototype.cancel=function(){if(this.i=fa(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const i of this.g.values())i.cancel();this.g.clear()}};function fa(i){if(i.h!=null)return i.i.concat(i.h.G);if(i.g!=null&&i.g.size!==0){let u=i.i;for(const l of i.g.values())u=u.concat(l.G);return u}return b(i.i)}var da=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function fh(i,u){if(i){i=i.split("&");for(let l=0;l<i.length;l++){const d=i[l].indexOf("=");let A,R=null;d>=0?(A=i[l].substring(0,d),R=i[l].substring(d+1)):A=i[l],u(A,R?decodeURIComponent(R.replace(/\+/g," ")):"")}}}function fe(i){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let u;i instanceof fe?(this.l=i.l,On(this,i.j),this.o=i.o,this.g=i.g,Ln(this,i.u),this.h=i.h,ii(this,Ea(i.i)),this.m=i.m):i&&(u=String(i).match(da))?(this.l=!1,On(this,u[1]||"",!0),this.o=Mn(u[2]||""),this.g=Mn(u[3]||"",!0),Ln(this,u[4]),this.h=Mn(u[5]||"",!0),ii(this,u[6]||"",!0),this.m=Mn(u[7]||"")):(this.l=!1,this.i=new Fn(null,this.l))}fe.prototype.toString=function(){const i=[];var u=this.j;u&&i.push(Un(u,ma,!0),":");var l=this.g;return(l||u=="file")&&(i.push("//"),(u=this.o)&&i.push(Un(u,ma,!0),"@"),i.push(Nn(l).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),l=this.u,l!=null&&i.push(":",String(l))),(l=this.h)&&(this.g&&l.charAt(0)!="/"&&i.push("/"),i.push(Un(l,l.charAt(0)=="/"?ph:mh,!0))),(l=this.i.toString())&&i.push("?",l),(l=this.m)&&i.push("#",Un(l,_h)),i.join("")},fe.prototype.resolve=function(i){const u=Wt(this);let l=!!i.j;l?On(u,i.j):l=!!i.o,l?u.o=i.o:l=!!i.g,l?u.g=i.g:l=i.u!=null;var d=i.h;if(l)Ln(u,i.u);else if(l=!!i.h){if(d.charAt(0)!="/")if(this.g&&!this.h)d="/"+d;else{var A=u.h.lastIndexOf("/");A!=-1&&(d=u.h.slice(0,A+1)+d)}if(A=d,A==".."||A==".")d="";else if(A.indexOf("./")!=-1||A.indexOf("/.")!=-1){d=A.lastIndexOf("/",0)==0,A=A.split("/");const R=[];for(let N=0;N<A.length;){const z=A[N++];z=="."?d&&N==A.length&&R.push(""):z==".."?((R.length>1||R.length==1&&R[0]!="")&&R.pop(),d&&N==A.length&&R.push("")):(R.push(z),d=!0)}d=R.join("/")}else d=A}return l?u.h=d:l=i.i.toString()!=="",l?ii(u,Ea(i.i)):l=!!i.m,l&&(u.m=i.m),u};function Wt(i){return new fe(i)}function On(i,u,l){i.j=l?Mn(u,!0):u,i.j&&(i.j=i.j.replace(/:$/,""))}function Ln(i,u){if(u){if(u=Number(u),isNaN(u)||u<0)throw Error("Bad port number "+u);i.u=u}else i.u=null}function ii(i,u,l){u instanceof Fn?(i.i=u,yh(i.i,i.l)):(l||(u=Un(u,gh)),i.i=new Fn(u,i.l))}function Z(i,u,l){i.i.set(u,l)}function Br(i){return Z(i,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),i}function Mn(i,u){return i?u?decodeURI(i.replace(/%25/g,"%2525")):decodeURIComponent(i):""}function Un(i,u,l){return typeof i=="string"?(i=encodeURI(i).replace(u,dh),l&&(i=i.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),i):null}function dh(i){return i=i.charCodeAt(0),"%"+(i>>4&15).toString(16)+(i&15).toString(16)}var ma=/[#\/\?@]/g,mh=/[#\?:]/g,ph=/[#\?]/g,gh=/[#\?@]/g,_h=/#/g;function Fn(i,u){this.h=this.g=null,this.i=i||null,this.j=!!u}function Fe(i){i.g||(i.g=new Map,i.h=0,i.i&&fh(i.i,function(u,l){i.add(decodeURIComponent(u.replace(/\+/g," ")),l)}))}n=Fn.prototype,n.add=function(i,u){Fe(this),this.i=null,i=en(this,i);let l=this.g.get(i);return l||this.g.set(i,l=[]),l.push(u),this.h+=1,this};function pa(i,u){Fe(i),u=en(i,u),i.g.has(u)&&(i.i=null,i.h-=i.g.get(u).length,i.g.delete(u))}function ga(i,u){return Fe(i),u=en(i,u),i.g.has(u)}n.forEach=function(i,u){Fe(this),this.g.forEach(function(l,d){l.forEach(function(A){i.call(u,A,d,this)},this)},this)};function _a(i,u){Fe(i);let l=[];if(typeof u=="string")ga(i,u)&&(l=l.concat(i.g.get(en(i,u))));else for(i=Array.from(i.g.values()),u=0;u<i.length;u++)l=l.concat(i[u]);return l}n.set=function(i,u){return Fe(this),this.i=null,i=en(this,i),ga(this,i)&&(this.h-=this.g.get(i).length),this.g.set(i,[u]),this.h+=1,this},n.get=function(i,u){return i?(i=_a(this,i),i.length>0?String(i[0]):u):u};function ya(i,u,l){pa(i,u),l.length>0&&(i.i=null,i.g.set(en(i,u),b(l)),i.h+=l.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const i=[],u=Array.from(this.g.keys());for(let d=0;d<u.length;d++){var l=u[d];const A=Nn(l);l=_a(this,l);for(let R=0;R<l.length;R++){let N=A;l[R]!==""&&(N+="="+Nn(l[R])),i.push(N)}}return this.i=i.join("&")};function Ea(i){const u=new Fn;return u.i=i.i,i.g&&(u.g=new Map(i.g),u.h=i.h),u}function en(i,u){return u=String(u),i.j&&(u=u.toLowerCase()),u}function yh(i,u){u&&!i.j&&(Fe(i),i.i=null,i.g.forEach(function(l,d){const A=d.toLowerCase();d!=A&&(pa(this,d),ya(this,A,l))},i)),i.j=u}function Eh(i,u){const l=new Dn;if(a.Image){const d=new Image;d.onload=m(de,l,"TestLoadImage: loaded",!0,u,d),d.onerror=m(de,l,"TestLoadImage: error",!1,u,d),d.onabort=m(de,l,"TestLoadImage: abort",!1,u,d),d.ontimeout=m(de,l,"TestLoadImage: timeout",!1,u,d),a.setTimeout(function(){d.ontimeout&&d.ontimeout()},1e4),d.src=i}else u(!1)}function Th(i,u){const l=new Dn,d=new AbortController,A=setTimeout(()=>{d.abort(),de(l,"TestPingServer: timeout",!1,u)},1e4);fetch(i,{signal:d.signal}).then(R=>{clearTimeout(A),R.ok?de(l,"TestPingServer: ok",!0,u):de(l,"TestPingServer: server error",!1,u)}).catch(()=>{clearTimeout(A),de(l,"TestPingServer: error",!1,u)})}function de(i,u,l,d,A){try{A&&(A.onload=null,A.onerror=null,A.onabort=null,A.ontimeout=null),d(l)}catch{}}function vh(){this.g=new rh}function oi(i){this.i=i.Sb||null,this.h=i.ab||!1}p(oi,Wo),oi.prototype.g=function(){return new qr(this.i,this.h)};function qr(i,u){wt.call(this),this.H=i,this.o=u,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}p(qr,wt),n=qr.prototype,n.open=function(i,u){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=i,this.D=u,this.readyState=1,qn(this)},n.send=function(i){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const u={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};i&&(u.body=i),(this.H||a).fetch(new Request(this.D,u)).then(this.Pa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,Bn(this)),this.readyState=0},n.Pa=function(i){if(this.g&&(this.l=i,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=i.headers,this.readyState=2,qn(this)),this.g&&(this.readyState=3,qn(this),this.g)))if(this.responseType==="arraybuffer")i.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof a.ReadableStream<"u"&&"body"in i){if(this.j=i.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Ta(this)}else i.text().then(this.Oa.bind(this),this.ga.bind(this))};function Ta(i){i.j.read().then(i.Ma.bind(i)).catch(i.ga.bind(i))}n.Ma=function(i){if(this.g){if(this.o&&i.value)this.response.push(i.value);else if(!this.o){var u=i.value?i.value:new Uint8Array(0);(u=this.B.decode(u,{stream:!i.done}))&&(this.response=this.responseText+=u)}i.done?Bn(this):qn(this),this.readyState==3&&Ta(this)}},n.Oa=function(i){this.g&&(this.response=this.responseText=i,Bn(this))},n.Na=function(i){this.g&&(this.response=i,Bn(this))},n.ga=function(){this.g&&Bn(this)};function Bn(i){i.readyState=4,i.l=null,i.j=null,i.B=null,qn(i)}n.setRequestHeader=function(i,u){this.A.append(i,u)},n.getResponseHeader=function(i){return this.h&&this.h.get(i.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const i=[],u=this.h.entries();for(var l=u.next();!l.done;)l=l.value,i.push(l[0]+": "+l[1]),l=u.next();return i.join(`\r
`)};function qn(i){i.onreadystatechange&&i.onreadystatechange.call(i)}Object.defineProperty(qr.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(i){this.m=i?"include":"same-origin"}});function va(i){let u="";return kr(i,function(l,d){u+=d,u+=":",u+=l,u+=`\r
`}),u}function ai(i,u,l){t:{for(d in l){var d=!1;break t}d=!0}d||(l=va(l),typeof i=="string"?l!=null&&Nn(l):Z(i,u,l))}function st(i){wt.call(this),this.headers=new Map,this.L=i||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}p(st,wt);var wh=/^https?$/i,Ih=["POST","PUT"];n=st.prototype,n.Fa=function(i){this.H=i},n.ea=function(i,u,l,d){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+i);u=u?u.toUpperCase():"GET",this.D=i,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():na.g(),this.g.onreadystatechange=I(f(this.Ca,this));try{this.B=!0,this.g.open(u,String(i),!0),this.B=!1}catch(R){wa(this,R);return}if(i=l||"",l=new Map(this.headers),d)if(Object.getPrototypeOf(d)===Object.prototype)for(var A in d)l.set(A,d[A]);else if(typeof d.keys=="function"&&typeof d.get=="function")for(const R of d.keys())l.set(R,d.get(R));else throw Error("Unknown input type for opt_headers: "+String(d));d=Array.from(l.keys()).find(R=>R.toLowerCase()=="content-type"),A=a.FormData&&i instanceof a.FormData,!(Array.prototype.indexOf.call(Ih,u,void 0)>=0)||d||A||l.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[R,N]of l)this.g.setRequestHeader(R,N);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(i),this.v=!1}catch(R){wa(this,R)}};function wa(i,u){i.h=!1,i.g&&(i.j=!0,i.g.abort(),i.j=!1),i.l=u,i.o=5,Ia(i),$r(i)}function Ia(i){i.A||(i.A=!0,Pt(i,"complete"),Pt(i,"error"))}n.abort=function(i){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=i||7,Pt(this,"complete"),Pt(this,"abort"),$r(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),$r(this,!0)),st.Z.N.call(this)},n.Ca=function(){this.u||(this.B||this.v||this.j?Aa(this):this.Xa())},n.Xa=function(){Aa(this)};function Aa(i){if(i.h&&typeof o<"u"){if(i.v&&me(i)==4)setTimeout(i.Ca.bind(i),0);else if(Pt(i,"readystatechange"),me(i)==4){i.h=!1;try{const R=i.ca();t:switch(R){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var u=!0;break t;default:u=!1}var l;if(!(l=u)){var d;if(d=R===0){let N=String(i.D).match(da)[1]||null;!N&&a.self&&a.self.location&&(N=a.self.location.protocol.slice(0,-1)),d=!wh.test(N?N.toLowerCase():"")}l=d}if(l)Pt(i,"complete"),Pt(i,"success");else{i.o=6;try{var A=me(i)>2?i.g.statusText:""}catch{A=""}i.l=A+" ["+i.ca()+"]",Ia(i)}}finally{$r(i)}}}}function $r(i,u){if(i.g){i.m&&(clearTimeout(i.m),i.m=null);const l=i.g;i.g=null,u||Pt(i,"ready");try{l.onreadystatechange=null}catch{}}}n.isActive=function(){return!!this.g};function me(i){return i.g?i.g.readyState:0}n.ca=function(){try{return me(this)>2?this.g.status:-1}catch{return-1}},n.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.La=function(i){if(this.g){var u=this.g.responseText;return i&&u.indexOf(i)==0&&(u=u.substring(i.length)),nh(u)}};function Va(i){try{if(!i.g)return null;if("response"in i.g)return i.g.response;switch(i.F){case"":case"text":return i.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in i.g)return i.g.mozResponseArrayBuffer}return null}catch{return null}}function Ah(i){const u={};i=(i.g&&me(i)>=2&&i.g.getAllResponseHeaders()||"").split(`\r
`);for(let d=0;d<i.length;d++){if(_(i[d]))continue;var l=uh(i[d]);const A=l[0];if(l=l[1],typeof l!="string")continue;l=l.trim();const R=u[A]||[];u[A]=R,R.push(l)}Yl(u,function(d){return d.join(", ")})}n.ya=function(){return this.o},n.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function $n(i,u,l){return l&&l.internalChannelParams&&l.internalChannelParams[i]||u}function Ra(i){this.za=0,this.i=[],this.j=new Dn,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=$n("failFast",!1,i),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=$n("baseRetryDelayMs",5e3,i),this.Za=$n("retryDelaySeedMs",1e4,i),this.Ta=$n("forwardChannelMaxRetries",2,i),this.va=$n("forwardChannelRequestTimeoutMs",2e4,i),this.ma=i&&i.xmlHttpFactory||void 0,this.Ua=i&&i.Rb||void 0,this.Aa=i&&i.useFetchStreams||!1,this.O=void 0,this.L=i&&i.supportsCrossDomainXhr||!1,this.M="",this.h=new ua(i&&i.concurrentRequestLimit),this.Ba=new vh,this.S=i&&i.fastHandshake||!1,this.R=i&&i.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=i&&i.Pb||!1,i&&i.ua&&this.j.ua(),i&&i.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&i&&i.detectBufferingProxy||!1,this.ia=void 0,i&&i.longPollingTimeout&&i.longPollingTimeout>0&&(this.ia=i.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}n=Ra.prototype,n.ka=8,n.I=1,n.connect=function(i,u,l,d){St(0),this.W=i,this.H=u||{},l&&d!==void 0&&(this.H.OSID=l,this.H.OAID=d),this.F=this.X,this.J=Oa(this,null,this.W),zr(this)};function ui(i){if(Pa(i),i.I==3){var u=i.V++,l=Wt(i.J);if(Z(l,"SID",i.M),Z(l,"RID",u),Z(l,"TYPE","terminate"),jn(i,l),u=new he(i,i.j,u),u.M=2,u.A=Br(Wt(l)),l=!1,a.navigator&&a.navigator.sendBeacon)try{l=a.navigator.sendBeacon(u.A.toString(),"")}catch{}!l&&a.Image&&(new Image().src=u.A,l=!0),l||(u.g=La(u.j,null),u.g.ea(u.A)),u.F=Date.now(),Fr(u)}ka(i)}function jr(i){i.g&&(li(i),i.g.cancel(),i.g=null)}function Pa(i){jr(i),i.v&&(a.clearTimeout(i.v),i.v=null),Gr(i),i.h.cancel(),i.m&&(typeof i.m=="number"&&a.clearTimeout(i.m),i.m=null)}function zr(i){if(!ca(i.h)&&!i.m){i.m=!0;var u=i.Ea;Tt||g(),vt||(Tt(),vt=!0),v.add(u,i),i.D=0}}function Vh(i,u){return la(i.h)>=i.h.j-(i.m?1:0)?!1:i.m?(i.i=u.G.concat(i.i),!0):i.I==1||i.I==2||i.D>=(i.Sa?0:i.Ta)?!1:(i.m=xn(f(i.Ea,i,u),Na(i,i.D)),i.D++,!0)}n.Ea=function(i){if(this.m)if(this.m=null,this.I==1){if(!i){this.V=Math.floor(Math.random()*1e5),i=this.V++;const A=new he(this,this.j,i);let R=this.o;if(this.U&&(R?(R=Fo(R),qo(R,this.U)):R=this.U),this.u!==null||this.R||(A.J=R,R=null),this.S)t:{for(var u=0,l=0;l<this.i.length;l++){e:{var d=this.i[l];if("__data__"in d.map&&(d=d.map.__data__,typeof d=="string")){d=d.length;break e}d=void 0}if(d===void 0)break;if(u+=d,u>4096){u=l;break t}if(u===4096||l===this.i.length-1){u=l+1;break t}}u=1e3}else u=1e3;u=Ca(this,A,u),l=Wt(this.J),Z(l,"RID",i),Z(l,"CVER",22),this.G&&Z(l,"X-HTTP-Session-Id",this.G),jn(this,l),R&&(this.R?u="headers="+Nn(va(R))+"&"+u:this.u&&ai(l,this.u,R)),si(this.h,A),this.Ra&&Z(l,"TYPE","init"),this.S?(Z(l,"$req",u),Z(l,"SID","null"),A.U=!0,ti(A,l,null)):ti(A,l,u),this.I=2}}else this.I==3&&(i?Sa(this,i):this.i.length==0||ca(this.h)||Sa(this))};function Sa(i,u){var l;u?l=u.l:l=i.V++;const d=Wt(i.J);Z(d,"SID",i.M),Z(d,"RID",l),Z(d,"AID",i.K),jn(i,d),i.u&&i.o&&ai(d,i.u,i.o),l=new he(i,i.j,l,i.D+1),i.u===null&&(l.J=i.o),u&&(i.i=u.G.concat(i.i)),u=Ca(i,l,1e3),l.H=Math.round(i.va*.5)+Math.round(i.va*.5*Math.random()),si(i.h,l),ti(l,d,u)}function jn(i,u){i.H&&kr(i.H,function(l,d){Z(u,d,l)}),i.l&&kr({},function(l,d){Z(u,d,l)})}function Ca(i,u,l){l=Math.min(i.i.length,l);const d=i.l?f(i.l.Ka,i.l,i):null;t:{var A=i.i;let z=-1;for(;;){const ft=["count="+l];z==-1?l>0?(z=A[0].g,ft.push("ofs="+z)):z=0:ft.push("ofs="+z);let X=!0;for(let pt=0;pt<l;pt++){var R=A[pt].g;const Yt=A[pt].map;if(R-=z,R<0)z=Math.max(0,A[pt].g-100),X=!1;else try{R="req"+R+"_"||"";try{var N=Yt instanceof Map?Yt:Object.entries(Yt);for(const[qe,pe]of N){let ge=pe;c(pe)&&(ge=Ws(pe)),ft.push(R+qe+"="+encodeURIComponent(ge))}}catch(qe){throw ft.push(R+"type="+encodeURIComponent("_badmap")),qe}}catch{d&&d(Yt)}}if(X){N=ft.join("&");break t}}N=void 0}return i=i.i.splice(0,l),u.G=i,N}function ba(i){if(!i.g&&!i.v){i.Y=1;var u=i.Da;Tt||g(),vt||(Tt(),vt=!0),v.add(u,i),i.A=0}}function ci(i){return i.g||i.v||i.A>=3?!1:(i.Y++,i.v=xn(f(i.Da,i),Na(i,i.A)),i.A++,!0)}n.Da=function(){if(this.v=null,xa(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var i=4*this.T;this.j.info("BP detection timer enabled: "+i),this.B=xn(f(this.Wa,this),i)}},n.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,St(10),jr(this),xa(this))};function li(i){i.B!=null&&(a.clearTimeout(i.B),i.B=null)}function xa(i){i.g=new he(i,i.j,"rpc",i.Y),i.u===null&&(i.g.J=i.o),i.g.P=0;var u=Wt(i.na);Z(u,"RID","rpc"),Z(u,"SID",i.M),Z(u,"AID",i.K),Z(u,"CI",i.F?"0":"1"),!i.F&&i.ia&&Z(u,"TO",i.ia),Z(u,"TYPE","xmlhttp"),jn(i,u),i.u&&i.o&&ai(u,i.u,i.o),i.O&&(i.g.H=i.O);var l=i.g;i=i.ba,l.M=1,l.A=Br(Wt(u)),l.u=null,l.R=!0,ia(l,i)}n.Va=function(){this.C!=null&&(this.C=null,jr(this),ci(this),St(19))};function Gr(i){i.C!=null&&(a.clearTimeout(i.C),i.C=null)}function Da(i,u){var l=null;if(i.g==u){Gr(i),li(i),i.g=null;var d=2}else if(ri(i.h,u))l=u.G,ha(i.h,u),d=1;else return;if(i.I!=0){if(u.o)if(d==1){l=u.u?u.u.length:0,u=Date.now()-u.F;var A=i.D;d=Mr(),Pt(d,new ta(d,l)),zr(i)}else ba(i);else if(A=u.m,A==3||A==0&&u.X>0||!(d==1&&Vh(i,u)||d==2&&ci(i)))switch(l&&l.length>0&&(u=i.h,u.i=u.i.concat(l)),A){case 1:Be(i,5);break;case 4:Be(i,10);break;case 3:Be(i,6);break;default:Be(i,2)}}}function Na(i,u){let l=i.Qa+Math.floor(Math.random()*i.Za);return i.isActive()||(l*=2),l*u}function Be(i,u){if(i.j.info("Error code "+u),u==2){var l=f(i.bb,i),d=i.Ua;const A=!d;d=new fe(d||"//www.google.com/images/cleardot.gif"),a.location&&a.location.protocol=="http"||On(d,"https"),Br(d),A?Eh(d.toString(),l):Th(d.toString(),l)}else St(2);i.I=0,i.l&&i.l.pa(u),ka(i),Pa(i)}n.bb=function(i){i?(this.j.info("Successfully pinged google.com"),St(2)):(this.j.info("Failed to ping google.com"),St(1))};function ka(i){if(i.I=0,i.ja=[],i.l){const u=fa(i.h);(u.length!=0||i.i.length!=0)&&(x(i.ja,u),x(i.ja,i.i),i.h.i.length=0,b(i.i),i.i.length=0),i.l.oa()}}function Oa(i,u,l){var d=l instanceof fe?Wt(l):new fe(l);if(d.g!="")u&&(d.g=u+"."+d.g),Ln(d,d.u);else{var A=a.location;d=A.protocol,u=u?u+"."+A.hostname:A.hostname,A=+A.port;const R=new fe(null);d&&On(R,d),u&&(R.g=u),A&&Ln(R,A),l&&(R.h=l),d=R}return l=i.G,u=i.wa,l&&u&&Z(d,l,u),Z(d,"VER",i.ka),jn(i,d),d}function La(i,u,l){if(u&&!i.L)throw Error("Can't create secondary domain capable XhrIo object.");return u=i.Aa&&!i.ma?new st(new oi({ab:l})):new st(i.ma),u.Fa(i.L),u}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function Ma(){}n=Ma.prototype,n.ra=function(){},n.qa=function(){},n.pa=function(){},n.oa=function(){},n.isActive=function(){return!0},n.Ka=function(){};function Hr(){}Hr.prototype.g=function(i,u){return new Ut(i,u)};function Ut(i,u){wt.call(this),this.g=new Ra(u),this.l=i,this.h=u&&u.messageUrlParams||null,i=u&&u.messageHeaders||null,u&&u.clientProtocolHeaderRequired&&(i?i["X-Client-Protocol"]="webchannel":i={"X-Client-Protocol":"webchannel"}),this.g.o=i,i=u&&u.initMessageHeaders||null,u&&u.messageContentType&&(i?i["X-WebChannel-Content-Type"]=u.messageContentType:i={"X-WebChannel-Content-Type":u.messageContentType}),u&&u.sa&&(i?i["X-WebChannel-Client-Profile"]=u.sa:i={"X-WebChannel-Client-Profile":u.sa}),this.g.U=i,(i=u&&u.Qb)&&!_(i)&&(this.g.u=i),this.A=u&&u.supportsCrossDomainXhr||!1,this.v=u&&u.sendRawJson||!1,(u=u&&u.httpSessionIdParam)&&!_(u)&&(this.g.G=u,i=this.h,i!==null&&u in i&&(i=this.h,u in i&&delete i[u])),this.j=new nn(this)}p(Ut,wt),Ut.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},Ut.prototype.close=function(){ui(this.g)},Ut.prototype.o=function(i){var u=this.g;if(typeof i=="string"){var l={};l.__data__=i,i=l}else this.v&&(l={},l.__data__=Ws(i),i=l);u.i.push(new hh(u.Ya++,i)),u.I==3&&zr(u)},Ut.prototype.N=function(){this.g.l=null,delete this.j,ui(this.g),delete this.g,Ut.Z.N.call(this)};function Ua(i){Ys.call(this),i.__headers__&&(this.headers=i.__headers__,this.statusCode=i.__status__,delete i.__headers__,delete i.__status__);var u=i.__sm__;if(u){t:{for(const l in u){i=l;break t}i=void 0}(this.i=i)&&(i=this.i,u=u!==null&&i in u?u[i]:void 0),this.data=u}else this.data=i}p(Ua,Ys);function Fa(){Js.call(this),this.status=1}p(Fa,Js);function nn(i){this.g=i}p(nn,Ma),nn.prototype.ra=function(){Pt(this.g,"a")},nn.prototype.qa=function(i){Pt(this.g,new Ua(i))},nn.prototype.pa=function(i){Pt(this.g,new Fa)},nn.prototype.oa=function(){Pt(this.g,"b")},Hr.prototype.createWebChannel=Hr.prototype.g,Ut.prototype.send=Ut.prototype.o,Ut.prototype.open=Ut.prototype.m,Ut.prototype.close=Ut.prototype.close,ic=function(){return new Hr},sc=function(){return Mr()},rc=Me,Ii={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Ur.NO_ERROR=0,Ur.TIMEOUT=8,Ur.HTTP_ERROR=6,ts=Ur,ea.COMPLETE="complete",nc=ea,Yo.EventType=Cn,Cn.OPEN="a",Cn.CLOSE="b",Cn.ERROR="c",Cn.MESSAGE="d",wt.prototype.listen=wt.prototype.J,Hn=Yo,st.prototype.listenOnce=st.prototype.K,st.prototype.getLastError=st.prototype.Ha,st.prototype.getLastErrorCode=st.prototype.ya,st.prototype.getStatus=st.prototype.ca,st.prototype.getResponseJson=st.prototype.La,st.prototype.getResponseText=st.prototype.la,st.prototype.send=st.prototype.ea,st.prototype.setWithCredentials=st.prototype.Fa,ec=st}).apply(typeof Kr<"u"?Kr:typeof self<"u"?self:typeof window<"u"?window:{});/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class At{constructor(t){this.uid=t}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(t){return t.uid===this.uid}}At.UNAUTHENTICATED=new At(null),At.GOOGLE_CREDENTIALS=new At("google-credentials-uid"),At.FIRST_PARTY=new At("first-party-uid"),At.MOCK_USER=new At("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Tn="12.15.0";function Xf(n){Tn=n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ie=new Yu("@firebase/firestore");function rn(){return Ie.logLevel}function Z_(n){Ie.setLogLevel(n)}function O(n,...t){if(Ie.logLevel<=W.DEBUG){const e=t.map(zi);Ie.debug(`Firestore (${Tn}): ${n}`,...e)}}function ce(n,...t){if(Ie.logLevel<=W.ERROR){const e=t.map(zi);Ie.error(`Firestore (${Tn}): ${n}`,...e)}}function Qt(n,...t){if(Ie.logLevel<=W.WARN){const e=t.map(zi);Ie.warn(`Firestore (${Tn}): ${n}`,...e)}}function zi(n){if(typeof n=="string")return n;try{return(function(e){return JSON.stringify(e)})(n)}catch{return n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function B(n,t,e){let r="Unexpected state";typeof t=="string"?r=t:e=t,oc(n,r,e)}function oc(n,t,e){let r=`FIRESTORE (${Tn}) INTERNAL ASSERTION FAILED: ${t} (ID: ${n.toString(16)})`;if(e!==void 0)try{r+=" CONTEXT: "+JSON.stringify(e)}catch{r+=" CONTEXT: "+e}throw ce(r),new Error(r)}function M(n,t,e,r){let s="Unexpected state";typeof e=="string"?s=e:r=e,n||oc(t,s,r)}function j(n,t){return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const S={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class k extends En{constructor(t,e){super(t,e),this.code=t,this.message=e,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ge{constructor(){this.promise=new Promise(((t,e)=>{this.resolve=t,this.reject=e}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ac{constructor(t,e){this.user=e,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${t}`)}}class Zf{getToken(){return Promise.resolve(null)}invalidateToken(){}start(t,e){t.enqueueRetryable((()=>e(At.UNAUTHENTICATED)))}shutdown(){}}class td{constructor(t){this.token=t,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(t,e){this.changeListener=e,t.enqueueRetryable((()=>e(this.token.user)))}shutdown(){this.changeListener=null}}class ed{constructor(t){this.t=t,this.currentUser=At.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(t,e){M(this.o===void 0,42304);let r=this.i;const s=h=>this.i!==r?(r=this.i,e(h)):Promise.resolve();let o=new Ge;this.o=()=>{this.i++,this.currentUser=this.u(),o.resolve(),o=new Ge,t.enqueueRetryable((()=>s(this.currentUser)))};const a=()=>{const h=o;t.enqueueRetryable((async()=>{await h.promise,await s(this.currentUser)}))},c=h=>{O("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=h,this.o&&(this.auth.addAuthTokenListener(this.o),a())};this.t.onInit((h=>c(h))),setTimeout((()=>{if(!this.auth){const h=this.t.getImmediate({optional:!0});h?c(h):(O("FirebaseAuthCredentialsProvider","Auth not yet detected"),o.resolve(),o=new Ge)}}),0),a()}getToken(){const t=this.i,e=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(e).then((r=>this.i!==t?(O("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(M(typeof r.accessToken=="string",31837,{l:r}),new ac(r.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const t=this.auth&&this.auth.getUid();return M(t===null||typeof t=="string",2055,{h:t}),new At(t)}}class nd{constructor(t,e,r){this.T=t,this.P=e,this.R=r,this.type="FirstParty",this.user=At.FIRST_PARTY,this.I=new Map}A(){return this.R?this.R():null}get headers(){this.I.set("X-Goog-AuthUser",this.T);const t=this.A();return t&&this.I.set("Authorization",t),this.P&&this.I.set("X-Goog-Iam-Authorization-Token",this.P),this.I}}class rd{constructor(t,e,r){this.T=t,this.P=e,this.R=r}getToken(){return Promise.resolve(new nd(this.T,this.P,this.R))}start(t,e){t.enqueueRetryable((()=>e(At.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class Ka{constructor(t){this.value=t,this.type="AppCheck",this.headers=new Map,t&&t.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class sd{constructor(t,e){this.V=e,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,kf(t)&&t.settings.appCheckToken&&(this.p=t.settings.appCheckToken)}start(t,e){M(this.o===void 0,3512);const r=o=>{o.error!=null&&O("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${o.error.message}`);const a=o.token!==this.m;return this.m=o.token,O("FirebaseAppCheckTokenProvider",`Received ${a?"new":"existing"} token.`),a?e(o.token):Promise.resolve()};this.o=o=>{t.enqueueRetryable((()=>r(o)))};const s=o=>{O("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=o,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit((o=>s(o))),setTimeout((()=>{if(!this.appCheck){const o=this.V.getImmediate({optional:!0});o?s(o):O("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.p)return Promise.resolve(new Ka(this.p));const t=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(t).then((e=>e?(M(typeof e.token=="string",44558,{tokenResult:e}),this.m=e.token,new Ka(e.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function id(n){const t=typeof self<"u"&&(self.crypto||self.msCrypto),e=new Uint8Array(n);if(t&&typeof t.getRandomValues=="function")t.getRandomValues(e);else for(let r=0;r<n;r++)e[r]=Math.floor(256*Math.random());return e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gi{static newId(){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",e=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const s=id(40);for(let o=0;o<s.length;++o)r.length<20&&s[o]<e&&(r+=t.charAt(s[o]%62))}return r}}function H(n,t){return n<t?-1:n>t?1:0}function Ai(n,t){const e=Math.min(n.length,t.length);for(let r=0;r<e;r++){const s=n.charAt(r),o=t.charAt(r);if(s!==o)return di(s)===di(o)?H(s,o):di(s)?1:-1}return H(n.length,t.length)}const od=55296,ad=57343;function di(n){const t=n.charCodeAt(0);return t>=od&&t<=ad}function hn(n,t,e){return n.length===t.length&&n.every(((r,s)=>e(r,t[s])))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fn="__name__";class Jt{constructor(t,e,r){e===void 0?e=0:e>t.length&&B(637,{offset:e,range:t.length}),r===void 0?r=t.length-e:r>t.length-e&&B(1746,{length:r,range:t.length-e}),this.segments=t,this.offset=e,this.len=r}get length(){return this.len}isEqual(t){return Jt.comparator(this,t)===0}child(t){const e=this.segments.slice(this.offset,this.limit());return t instanceof Jt?t.forEach((r=>{e.push(r)})):e.push(t),this.construct(e)}limit(){return this.offset+this.length}popFirst(t){return t=t===void 0?1:t,this.construct(this.segments,this.offset+t,this.length-t)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(t){return this.segments[this.offset+t]}isEmpty(){return this.length===0}isPrefixOf(t){if(t.length<this.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}isImmediateParentOf(t){if(this.length+1!==t.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}forEach(t){for(let e=this.offset,r=this.limit();e<r;e++)t(this.segments[e])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(t,e){const r=Math.min(t.length,e.length);for(let s=0;s<r;s++){const o=Jt.compareSegments(t.get(s),e.get(s));if(o!==0)return o}return H(t.length,e.length)}static compareSegments(t,e){const r=Jt.isNumericId(t),s=Jt.isNumericId(e);return r&&!s?-1:!r&&s?1:r&&s?Jt.extractNumericId(t).compare(Jt.extractNumericId(e)):Ai(t,e)}static isNumericId(t){return t.startsWith("__id")&&t.endsWith("__")}static extractNumericId(t){return Ee.fromString(t.substring(4,t.length-2))}}class Y extends Jt{construct(t,e,r){return new Y(t,e,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toStringWithLeadingSlash(){return`/${this.canonicalString()}`}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...t){const e=[];for(const r of t){if(r.indexOf("//")>=0)throw new k(S.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);e.push(...r.split("/").filter((s=>s.length>0)))}return new Y(e)}static emptyPath(){return new Y([])}}const ud=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class dt extends Jt{construct(t,e,r){return new dt(t,e,r)}static isValidIdentifier(t){return ud.test(t)}canonicalString(){return this.toArray().map((t=>(t=t.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),dt.isValidIdentifier(t)||(t="`"+t+"`"),t))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===fn}static keyField(){return new dt([fn])}static fromServerFormat(t){const e=[];let r="",s=0;const o=()=>{if(r.length===0)throw new k(S.INVALID_ARGUMENT,`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);e.push(r),r=""};let a=!1;for(;s<t.length;){const c=t[s];if(c==="\\"){if(s+1===t.length)throw new k(S.INVALID_ARGUMENT,"Path has trailing escape character: "+t);const h=t[s+1];if(h!=="\\"&&h!=="."&&h!=="`")throw new k(S.INVALID_ARGUMENT,"Path has invalid escape sequence: "+t);r+=h,s+=2}else c==="`"?(a=!a,s++):c!=="."||a?(r+=c,s++):(o(),s++)}if(o(),a)throw new k(S.INVALID_ARGUMENT,"Unterminated ` in path: "+t);return new dt(e)}static emptyPath(){return new dt([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class F{constructor(t){this.path=t}static fromPath(t){return new F(Y.fromString(t))}static fromName(t){return new F(Y.fromString(t).popFirst(5))}static empty(){return new F(Y.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(t){return this.path.length>=2&&this.path.get(this.path.length-2)===t}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(t){return t!==null&&Y.comparator(this.path,t.path)===0}toString(){return this.path.toString()}static comparator(t,e){return Y.comparator(t.path,e.path)}static isDocumentKey(t){return t.length%2==0}static fromSegments(t){return new F(new Y(t.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function uc(n,t,e){if(!e)throw new k(S.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${t}.`)}function cd(n,t,e,r){if(t===!0&&r===!0)throw new k(S.INVALID_ARGUMENT,`${n} and ${e} cannot be used together.`)}function Wa(n){if(!F.isDocumentKey(n))throw new k(S.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function Ya(n){if(F.isDocumentKey(n))throw new k(S.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function Ir(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function ws(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const t=(function(r){return r.constructor?r.constructor.name:null})(n);return t?`a custom ${t} object`:"an object"}}return typeof n=="function"?"a function":B(12329,{type:typeof n})}function oe(n,t){if("_delegate"in n&&(n=n._delegate),!(n instanceof t)){if(t.name===n.constructor.name)throw new k(S.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const e=ws(n);throw new k(S.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${e}`)}}return n}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ut(n,t){const e={typeString:n};return t&&(e.value=t),e}function Ar(n,t){if(!Ir(n))throw new k(S.INVALID_ARGUMENT,"JSON must be an object");let e;for(const r in t)if(t[r]){const s=t[r].typeString,o="value"in t[r]?{value:t[r].value}:void 0;if(!(r in n)){e=`JSON missing required field: '${r}'`;break}const a=n[r];if(s&&typeof a!==s){e=`JSON field '${r}' must be a ${s}.`;break}if(o!==void 0&&a!==o.value){e=`Expected '${r}' field to equal '${o.value}'`;break}}if(e)throw new k(S.INVALID_ARGUMENT,e);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ja=-62135596800,Xa=1e6;class tt{static now(){return tt.fromMillis(Date.now())}static fromDate(t){return tt.fromMillis(t.getTime())}static fromMillis(t){const e=Math.floor(t/1e3),r=Math.floor((t-1e3*e)*Xa);return new tt(e,r)}constructor(t,e){if(this.seconds=t,this.nanoseconds=e,e<0)throw new k(S.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(e>=1e9)throw new k(S.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(t<Ja)throw new k(S.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t);if(t>=253402300800)throw new k(S.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Xa}_compareTo(t){return this.seconds===t.seconds?H(this.nanoseconds,t.nanoseconds):H(this.seconds,t.seconds)}isEqual(t){return t.seconds===this.seconds&&t.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:tt._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(t){if(Ar(t,tt._jsonSchema))return new tt(t.seconds,t.nanoseconds)}valueOf(){const t=this.seconds-Ja;return String(t).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}tt._jsonSchemaVersion="firestore/timestamp/1.0",tt._jsonSchema={type:ut("string",tt._jsonSchemaVersion),seconds:ut("number"),nanoseconds:ut("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ${static fromTimestamp(t){return new $(t)}static min(){return new $(new tt(0,0))}static max(){return new $(new tt(253402300799,999999999))}constructor(t){this.timestamp=t}compareTo(t){return this.timestamp._compareTo(t.timestamp)}isEqual(t){return this.timestamp.isEqual(t.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const or=-1;function ld(n,t){const e=n.toTimestamp().seconds,r=n.toTimestamp().nanoseconds+1,s=$.fromTimestamp(r===1e9?new tt(e+1,0):new tt(e,r));return new Ae(s,F.empty(),t)}function hd(n){return new Ae(n.readTime,n.key,or)}class Ae{constructor(t,e,r){this.readTime=t,this.documentKey=e,this.largestBatchId=r}static min(){return new Ae($.min(),F.empty(),or)}static max(){return new Ae($.max(),F.empty(),or)}}function fd(n,t){let e=n.readTime.compareTo(t.readTime);return e!==0?e:(e=F.comparator(n.documentKey,t.documentKey),e!==0?e:H(n.largestBatchId,t.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dd="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class md{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(t){this.onCommittedListeners.push(t)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((t=>t()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function vn(n){if(n.code!==S.FAILED_PRECONDITION||n.message!==dd)throw n;O("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class C{constructor(t){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,t((e=>{this.isDone=!0,this.result=e,this.nextCallback&&this.nextCallback(e)}),(e=>{this.isDone=!0,this.error=e,this.catchCallback&&this.catchCallback(e)}))}catch(t){return this.next(void 0,t)}next(t,e){return this.callbackAttached&&B(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(e,this.error):this.wrapSuccess(t,this.result):new C(((r,s)=>{this.nextCallback=o=>{this.wrapSuccess(t,o).next(r,s)},this.catchCallback=o=>{this.wrapFailure(e,o).next(r,s)}}))}toPromise(){return new Promise(((t,e)=>{this.next(t,e)}))}wrapUserFunction(t){try{const e=t();return e instanceof C?e:C.resolve(e)}catch(e){return C.reject(e)}}wrapSuccess(t,e){return t?this.wrapUserFunction((()=>t(e))):C.resolve(e)}wrapFailure(t,e){return t?this.wrapUserFunction((()=>t(e))):C.reject(e)}static resolve(t){return new C(((e,r)=>{e(t)}))}static reject(t){return new C(((e,r)=>{r(t)}))}static waitFor(t){return new C(((e,r)=>{let s=0,o=0,a=!1;t.forEach((c=>{++s,c.next((()=>{++o,a&&o===s&&e()}),(h=>r(h)))})),a=!0,o===s&&e()}))}static or(t){let e=C.resolve(!1);for(const r of t)e=e.next((s=>s?C.resolve(s):r()));return e}static forEach(t,e){const r=[];return t.forEach(((s,o)=>{r.push(e.call(this,s,o))})),this.waitFor(r)}static mapArray(t,e){return new C(((r,s)=>{const o=t.length,a=new Array(o);let c=0;for(let h=0;h<o;h++){const f=h;e(t[f]).next((m=>{a[f]=m,++c,c===o&&r(a)}),(m=>s(m)))}}))}static doWhile(t,e){return new C(((r,s)=>{const o=()=>{t()===!0?e().next((()=>{o()}),s):r()};o()}))}}function pd(n){const t=n.match(/Android ([\d.]+)/i),e=t?t[1].split(".").slice(0,2).join("."):"-1";return Number(e)}function wn(n){return n.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Is{constructor(t,e){this.previousValue=t,e&&(e.sequenceNumberHandler=r=>this.ae(r),this.ue=r=>e.writeSequenceNumber(r))}ae(t){return this.previousValue=Math.max(t,this.previousValue),this.previousValue}next(){const t=++this.previousValue;return this.ue&&this.ue(t),t}}Is.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hi=-1;function As(n){return n==null}function ar(n){return n===0&&1/n==-1/0}function gd(n){return typeof n=="number"&&Number.isInteger(n)&&!ar(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}function _d(n){return typeof n=="string"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cc="";function yd(n){let t="";for(let e=0;e<n.length;e++)t.length>0&&(t=Za(t)),t=Ed(n.get(e),t);return Za(t)}function Ed(n,t){let e=t;const r=n.length;for(let s=0;s<r;s++){const o=n.charAt(s);switch(o){case"\0":e+="";break;case cc:e+="";break;default:e+=o}}return e}function Za(n){return n+cc+""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class et{constructor(t,e){this.comparator=t,this.root=e||yt.EMPTY}insert(t,e){return new et(this.comparator,this.root.insert(t,e,this.comparator).copy(null,null,yt.BLACK,null,null))}remove(t){return new et(this.comparator,this.root.remove(t,this.comparator).copy(null,null,yt.BLACK,null,null))}get(t){let e=this.root;for(;!e.isEmpty();){const r=this.comparator(t,e.key);if(r===0)return e.value;r<0?e=e.left:r>0&&(e=e.right)}return null}indexOf(t){let e=0,r=this.root;for(;!r.isEmpty();){const s=this.comparator(t,r.key);if(s===0)return e+r.left.size;s<0?r=r.left:(e+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(t){return this.root.inorderTraversal(t)}forEach(t){this.inorderTraversal(((e,r)=>(t(e,r),!1)))}toString(){const t=[];return this.inorderTraversal(((e,r)=>(t.push(`${e}:${r}`),!1))),`{${t.join(", ")}}`}reverseTraversal(t){return this.root.reverseTraversal(t)}getIterator(){return new Wr(this.root,null,this.comparator,!1)}getIteratorFrom(t){return new Wr(this.root,t,this.comparator,!1)}getReverseIterator(){return new Wr(this.root,null,this.comparator,!0)}getReverseIteratorFrom(t){return new Wr(this.root,t,this.comparator,!0)}}class Wr{constructor(t,e,r,s){this.isReverse=s,this.nodeStack=[];let o=1;for(;!t.isEmpty();)if(o=e?r(t.key,e):1,e&&s&&(o*=-1),o<0)t=this.isReverse?t.left:t.right;else{if(o===0){this.nodeStack.push(t);break}this.nodeStack.push(t),t=this.isReverse?t.right:t.left}}getNext(){let t=this.nodeStack.pop();const e={key:t.key,value:t.value};if(this.isReverse)for(t=t.left;!t.isEmpty();)this.nodeStack.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack.push(t),t=t.left;return e}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const t=this.nodeStack[this.nodeStack.length-1];return{key:t.key,value:t.value}}}class yt{constructor(t,e,r,s,o){this.key=t,this.value=e,this.color=r??yt.RED,this.left=s??yt.EMPTY,this.right=o??yt.EMPTY,this.size=this.left.size+1+this.right.size}copy(t,e,r,s,o){return new yt(t??this.key,e??this.value,r??this.color,s??this.left,o??this.right)}isEmpty(){return!1}inorderTraversal(t){return this.left.inorderTraversal(t)||t(this.key,this.value)||this.right.inorderTraversal(t)}reverseTraversal(t){return this.right.reverseTraversal(t)||t(this.key,this.value)||this.left.reverseTraversal(t)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(t,e,r){let s=this;const o=r(t,s.key);return s=o<0?s.copy(null,null,null,s.left.insert(t,e,r),null):o===0?s.copy(null,e,null,null,null):s.copy(null,null,null,null,s.right.insert(t,e,r)),s.fixUp()}removeMin(){if(this.left.isEmpty())return yt.EMPTY;let t=this;return t.left.isRed()||t.left.left.isRed()||(t=t.moveRedLeft()),t=t.copy(null,null,null,t.left.removeMin(),null),t.fixUp()}remove(t,e){let r,s=this;if(e(t,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(t,e),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),e(t,s.key)===0){if(s.right.isEmpty())return yt.EMPTY;r=s.right.min(),s=s.copy(r.key,r.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(t,e))}return s.fixUp()}isRed(){return this.color}fixUp(){let t=this;return t.right.isRed()&&!t.left.isRed()&&(t=t.rotateLeft()),t.left.isRed()&&t.left.left.isRed()&&(t=t.rotateRight()),t.left.isRed()&&t.right.isRed()&&(t=t.colorFlip()),t}moveRedLeft(){let t=this.colorFlip();return t.right.left.isRed()&&(t=t.copy(null,null,null,null,t.right.rotateRight()),t=t.rotateLeft(),t=t.colorFlip()),t}moveRedRight(){let t=this.colorFlip();return t.left.left.isRed()&&(t=t.rotateRight(),t=t.colorFlip()),t}rotateLeft(){const t=this.copy(null,null,yt.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight(){const t=this.copy(null,null,yt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip(){const t=this.left.copy(null,null,!this.left.color,null,null),e=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,t,e)}checkMaxDepth(){const t=this.check();return Math.pow(2,t)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw B(43730,{key:this.key,value:this.value});if(this.right.isRed())throw B(14113,{key:this.key,value:this.value});const t=this.left.check();if(t!==this.right.check())throw B(27949);return t+(this.isRed()?0:1)}}yt.EMPTY=null,yt.RED=!0,yt.BLACK=!1;yt.EMPTY=new class{constructor(){this.size=0}get key(){throw B(57766)}get value(){throw B(16141)}get color(){throw B(16727)}get left(){throw B(29726)}get right(){throw B(36894)}copy(t,e,r,s,o){return this}insert(t,e,r){return new yt(t,e)}remove(t,e){return this}isEmpty(){return!0}inorderTraversal(t){return!1}reverseTraversal(t){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ct{constructor(t){this.comparator=t,this.data=new et(this.comparator)}has(t){return this.data.get(t)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(t){return this.data.indexOf(t)}forEach(t){this.data.inorderTraversal(((e,r)=>(t(e),!1)))}forEachInRange(t,e){const r=this.data.getIteratorFrom(t[0]);for(;r.hasNext();){const s=r.getNext();if(this.comparator(s.key,t[1])>=0)return;e(s.key)}}forEachWhile(t,e){let r;for(r=e!==void 0?this.data.getIteratorFrom(e):this.data.getIterator();r.hasNext();)if(!t(r.getNext().key))return}firstAfterOrEqual(t){const e=this.data.getIteratorFrom(t);return e.hasNext()?e.getNext().key:null}getIterator(){return new tu(this.data.getIterator())}getIteratorFrom(t){return new tu(this.data.getIteratorFrom(t))}add(t){return this.copy(this.data.remove(t).insert(t,!0))}delete(t){return this.has(t)?this.copy(this.data.remove(t)):this}isEmpty(){return this.data.isEmpty()}unionWith(t){let e=this;return e.size<t.size&&(e=t,t=this),t.forEach((r=>{e=e.add(r)})),e}isEqual(t){if(!(t instanceof ct)||this.size!==t.size)return!1;const e=this.data.getIterator(),r=t.data.getIterator();for(;e.hasNext();){const s=e.getNext().key,o=r.getNext().key;if(this.comparator(s,o)!==0)return!1}return!0}toArray(){const t=[];return this.forEach((e=>{t.push(e)})),t}toString(){const t=[];return this.forEach((e=>t.push(e))),"SortedSet("+t.toString()+")"}copy(t){const e=new ct(this.comparator);return e.data=t,e}}class tu{constructor(t){this.iter=t}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bt{constructor(t){this.fields=t,t.sort(dt.comparator)}static empty(){return new Bt([])}unionWith(t){let e=new ct(dt.comparator);for(const r of this.fields)e=e.add(r);for(const r of t)e=e.add(r);return new Bt(e.toArray())}covers(t){for(const e of this.fields)if(e.isPrefixOf(t))return!0;return!1}isEqual(t){return hn(this.fields,t.fields,((e,r)=>e.isEqual(r)))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function us(n){let t=0;for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t++;return t}function ke(n,t){for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t(e,n[e])}function Td(n,t){const e=[];for(const r in n)Object.prototype.hasOwnProperty.call(n,r)&&e.push(t(n[r],r,n));return e}function lc(n){for(const t in n)if(Object.prototype.hasOwnProperty.call(n,t))return!1;return!0}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hc extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lt{constructor(t){this.binaryString=t}static fromBase64String(t){const e=(function(s){try{return atob(s)}catch(o){throw typeof DOMException<"u"&&o instanceof DOMException?new hc("Invalid base64 string: "+o):o}})(t);return new lt(e)}static fromUint8Array(t){const e=(function(s){let o="";for(let a=0;a<s.length;++a)o+=String.fromCharCode(s[a]);return o})(t);return new lt(e)}[Symbol.iterator](){let t=0;return{next:()=>t<this.binaryString.length?{value:this.binaryString.charCodeAt(t++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(e){return btoa(e)})(this.binaryString)}toUint8Array(){return(function(e){const r=new Uint8Array(e.length);for(let s=0;s<e.length;s++)r[s]=e.charCodeAt(s);return r})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(t){return H(this.binaryString,t.binaryString)}isEqual(t){return this.binaryString===t.binaryString}}lt.EMPTY_BYTE_STRING=new lt("");const vd=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Ve(n){if(M(!!n,39018),typeof n=="string"){let t=0;const e=vd.exec(n);if(M(!!e,46558,{timestamp:n}),e[1]){let s=e[1];s=(s+"000000000").substr(0,9),t=Number(s)}const r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:t}}return{seconds:nt(n.seconds),nanos:nt(n.nanos)}}function nt(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function Re(n){return typeof n=="string"?lt.fromBase64String(n):lt.fromUint8Array(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fc="server_timestamp",dc="__type__",mc="__previous_value__",pc="__local_write_time__";function Vs(n){var e,r;return((r=(((e=n==null?void 0:n.mapValue)==null?void 0:e.fields)||{})[dc])==null?void 0:r.stringValue)===fc}function Vr(n){const t=n.mapValue.fields[mc];return Vs(t)?Vr(t):t}function dn(n){const t=Ve(n.mapValue.fields[pc].timestampValue);return new tt(t.seconds,t.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wd{constructor(t,e,r,s,o,a,c,h,f,m,p){this.databaseId=t,this.appId=e,this.persistenceKey=r,this.host=s,this.ssl=o,this.forceLongPolling=a,this.autoDetectLongPolling=c,this.longPollingOptions=h,this.useFetchStreams=f,this.isUsingEmulator=m,this.apiKey=p}}const ur="(default)";class cr{constructor(t,e){this.projectId=t,this.database=e||ur}static empty(){return new cr("","")}get isDefaultDatabase(){return this.database===ur}isEqual(t){return t instanceof cr&&t.projectId===this.projectId&&t.database===this.database}}function Id(n,t){if(!Object.prototype.hasOwnProperty.apply(n.options,["projectId"]))throw new k(S.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new cr(n.options.projectId,t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gc="__type__",Ad="__max__",Yr={mapValue:{}},_c="__vector__",lr="value",mn={nullValue:"NULL_VALUE"},Ot={booleanValue:!0},_t={booleanValue:!1};function ht(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?Vs(n)?4:Vd(n)?9007199254740991:cs(n)?10:11:B(28295,{value:n})}function Gt(n,t,e){if(n===t)return!0;const r=ht(n);if(r!==ht(t))return!1;switch(r){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===t.booleanValue;case 4:return dn(n).isEqual(dn(t));case 3:return(function(o,a){if(typeof o.timestampValue=="string"&&typeof a.timestampValue=="string"&&o.timestampValue.length===a.timestampValue.length)return o.timestampValue===a.timestampValue;const c=Ve(o.timestampValue),h=Ve(a.timestampValue);return c.seconds===h.seconds&&c.nanos===h.nanos})(n,t);case 5:return n.stringValue===t.stringValue;case 6:return(function(o,a){return Re(o.bytesValue).isEqual(Re(a.bytesValue))})(n,t);case 7:return n.referenceValue===t.referenceValue;case 8:return(function(o,a){return nt(o.geoPointValue.latitude)===nt(a.geoPointValue.latitude)&&nt(o.geoPointValue.longitude)===nt(a.geoPointValue.longitude)})(n,t);case 2:return(function(o,a,c){if("integerValue"in o&&"integerValue"in a)return nt(o.integerValue)===nt(a.integerValue);let h,f;if("doubleValue"in o&&"doubleValue"in a)h=nt(o.doubleValue),f=nt(a.doubleValue);else{if(!(c!=null&&c.Ee))return!1;h=nt(o.integerValue??o.doubleValue),f=nt(a.integerValue??a.doubleValue)}return h===f?!!(c!=null&&c.he)||ar(h)===ar(f):!!(c===void 0||c.Te)&&isNaN(h)&&isNaN(f)})(n,t,e);case 9:return hn(n.arrayValue.values||[],t.arrayValue.values||[],((s,o)=>Gt(s,o,e)));case 10:case 11:return(function(o,a,c){const h=o.mapValue.fields||{},f=a.mapValue.fields||{};if(us(h)!==us(f))return!1;for(const m in h)if(h.hasOwnProperty(m)&&(f[m]===void 0||!Gt(h[m],f[m],c)))return!1;return!0})(n,t,e);default:return B(52216,{left:n})}}function hr(n,t){return(n.values||[]).find((e=>Gt(e,t)))!==void 0}function Lt(n,t){if(n===t)return 0;const e=ht(n),r=ht(t);if(e!==r)return H(e,r);switch(e){case 0:case 9007199254740991:return 0;case 1:return H(n.booleanValue,t.booleanValue);case 2:return(function(o,a){const c=nt(o.integerValue||o.doubleValue),h=nt(a.integerValue||a.doubleValue);return c<h?-1:c>h?1:c===h?0:isNaN(c)?isNaN(h)?0:-1:1})(n,t);case 3:return eu(n.timestampValue,t.timestampValue);case 4:return eu(dn(n),dn(t));case 5:return Ai(n.stringValue,t.stringValue);case 6:return(function(o,a){const c=Re(o),h=Re(a);return c.compareTo(h)})(n.bytesValue,t.bytesValue);case 7:return(function(o,a){const c=o.split("/"),h=a.split("/");for(let f=0;f<c.length&&f<h.length;f++){const m=H(c[f],h[f]);if(m!==0)return m}return H(c.length,h.length)})(n.referenceValue,t.referenceValue);case 8:return(function(o,a){const c=H(nt(o.latitude),nt(a.latitude));return c!==0?c:H(nt(o.longitude),nt(a.longitude))})(n.geoPointValue,t.geoPointValue);case 9:return nu(n.arrayValue,t.arrayValue);case 10:return(function(o,a){var I,b,x,U;const c=o.fields||{},h=a.fields||{},f=(I=c[lr])==null?void 0:I.arrayValue,m=(b=h[lr])==null?void 0:b.arrayValue,p=H(((x=f==null?void 0:f.values)==null?void 0:x.length)||0,((U=m==null?void 0:m.values)==null?void 0:U.length)||0);return p!==0?p:nu(f,m)})(n.mapValue,t.mapValue);case 11:return(function(o,a){if(o===Yr.mapValue&&a===Yr.mapValue)return 0;if(o===Yr.mapValue)return 1;if(a===Yr.mapValue)return-1;const c=o.fields||{},h=Object.keys(c),f=a.fields||{},m=Object.keys(f);h.sort(),m.sort();for(let p=0;p<h.length&&p<m.length;++p){const I=Ai(h[p],m[p]);if(I!==0)return I;const b=Lt(c[h[p]],f[m[p]]);if(b!==0)return b}return H(h.length,m.length)})(n.mapValue,t.mapValue);default:throw B(23264,{Pe:e})}}function eu(n,t){if(typeof n=="string"&&typeof t=="string"&&n.length===t.length)return H(n,t);const e=Ve(n),r=Ve(t),s=H(e.seconds,r.seconds);return s!==0?s:H(e.nanos,r.nanos)}function nu(n,t){const e=n.values||[],r=t.values||[];for(let s=0;s<e.length&&s<r.length;++s){const o=Lt(e[s],r[s]);if(o!==void 0&&o!==0)return o}return H(e.length,r.length)}function pn(n){return Vi(n)}function Vi(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?(function(e){const r=Ve(e);return`time(${r.seconds},${r.nanos})`})(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?(function(e){return Re(e).toBase64()})(n.bytesValue):"referenceValue"in n?(function(e){return F.fromName(e).toString()})(n.referenceValue):"geoPointValue"in n?(function(e){return`geo(${e.latitude},${e.longitude})`})(n.geoPointValue):"arrayValue"in n?(function(e){let r="[",s=!0;for(const o of e.values||[])s?s=!1:r+=",",r+=Vi(o);return r+"]"})(n.arrayValue):"mapValue"in n?(function(e){const r=Object.keys(e.fields||{}).sort();let s="{",o=!0;for(const a of r)o?o=!1:s+=",",s+=`${a}:${Vi(e.fields[a])}`;return s+"}"})(n.mapValue):B(61005,{value:n})}function es(n){switch(ht(n)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const t=Vr(n);return t?16+es(t):16;case 5:return 2*n.stringValue.length;case 6:return Re(n.bytesValue).approximateByteSize();case 7:return n.referenceValue.length;case 9:return(function(r){return(r.values||[]).reduce(((s,o)=>s+es(o)),0)})(n.arrayValue);case 10:case 11:return(function(r){let s=0;return ke(r.fields,((o,a)=>{s+=o.length+es(a)})),s})(n.mapValue);default:throw B(13486,{value:n})}}function ru(n,t){return{referenceValue:`projects/${n.projectId}/databases/${n.database}/documents/${t.path.canonicalString()}`}}function Xt(n){return!!n&&"integerValue"in n}function ze(n){return!!n&&"doubleValue"in n}function Pe(n){return Xt(n)||ze(n)}function gn(n){return!!n&&"arrayValue"in n}function qt(n){return!!n&&"nullValue"in n}function Mt(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function He(n){return!!n&&"mapValue"in n}function cs(n){var e,r;return((r=(((e=n==null?void 0:n.mapValue)==null?void 0:e.fields)||{})[gc])==null?void 0:r.stringValue)===_c}function Ri(n){var t,e;return(e=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[lr])==null?void 0:e.arrayValue}function Yn(n){if(n.geoPointValue)return{geoPointValue:{...n.geoPointValue}};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:{...n.timestampValue}};if(n.mapValue){const t={mapValue:{fields:{}}};return ke(n.mapValue.fields,((e,r)=>t.mapValue.fields[e]=Yn(r))),t}if(n.arrayValue){const t={arrayValue:{values:[]}};for(let e=0;e<(n.arrayValue.values||[]).length;++e)t.arrayValue.values[e]=Yn(n.arrayValue.values[e]);return t}return{...n}}function Vd(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue===Ad}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ct{constructor(t){this.value=t}static empty(){return new Ct({mapValue:{}})}field(t){if(t.isEmpty())return this.value;{let e=this.value;for(let r=0;r<t.length-1;++r)if(e=(e.mapValue.fields||{})[t.get(r)],!He(e))return null;return e=(e.mapValue.fields||{})[t.lastSegment()],e||null}}set(t,e){this.getFieldsMap(t.popLast())[t.lastSegment()]=Yn(e)}setAll(t){let e=dt.emptyPath(),r={},s=[];t.forEach(((a,c)=>{if(!e.isImmediateParentOf(c)){const h=this.getFieldsMap(e);this.applyChanges(h,r,s),r={},s=[],e=c.popLast()}a?r[c.lastSegment()]=Yn(a):s.push(c.lastSegment())}));const o=this.getFieldsMap(e);this.applyChanges(o,r,s)}delete(t){const e=this.field(t.popLast());He(e)&&e.mapValue.fields&&delete e.mapValue.fields[t.lastSegment()]}isEqual(t){return Gt(this.value,t.value)}getFieldsMap(t){let e=this.value;e.mapValue.fields||(e.mapValue={fields:{}});for(let r=0;r<t.length;++r){let s=e.mapValue.fields[t.get(r)];He(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},e.mapValue.fields[t.get(r)]=s),e=s}return e.mapValue.fields}applyChanges(t,e,r){ke(e,((s,o)=>t[s]=o));for(const s of r)delete t[s]}clone(){return new Ct(Yn(this.value))}}function yc(n){const t=[];return ke(n.fields,((e,r)=>{const s=new dt([e]);if(He(r)){const o=yc(r.mapValue).fields;if(o.length===0)t.push(s);else for(const a of o)t.push(s.child(a))}else t.push(s)})),new Bt(t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rs(n,t){if(n.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:ar(t)?"-0":t}}function Qi(n){return{integerValue:""+n}}function Ki(n,t,e){return Number.isInteger(t)&&(e!=null&&e.preferIntegers)||gd(t)?Qi(t):Rs(n,t)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ps{constructor(){this._=void 0}}function Rd(n,t,e){return n instanceof ls?(function(s,o){const a={fields:{[dc]:{stringValue:fc},[pc]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return o&&Vs(o)&&(o=Vr(o)),o&&(a.fields[mc]=o),{mapValue:a}})(e,t):n instanceof fr?Tc(n,t):n instanceof dr?vc(n,t):n instanceof mr?(function(s,o){const a=Ec(s,o),c=ds(a)+ds(s.Re);return Xt(a)&&Xt(s.Re)?Qi(c):Rs(s.serializer,c)})(n,t):n instanceof hs?(function(s,o){return su(s,o,Math.min)})(n,t):n instanceof fs?(function(s,o){return su(s,o,Math.max)})(n,t):void 0}function Pd(n,t,e){return n instanceof fr?Tc(n,t):n instanceof dr?vc(n,t):e}function Ec(n,t){return n instanceof mr?Pe(t)?t:{integerValue:0}:null}class ls extends Ps{}class fr extends Ps{constructor(t){super(),this.elements=t}}function Tc(n,t){const e=wc(t);for(const r of n.elements)e.some((s=>Gt(s,r)))||e.push(r);return{arrayValue:{values:e}}}class dr extends Ps{constructor(t){super(),this.elements=t}}function vc(n,t){let e=wc(t);for(const r of n.elements)e=e.filter((s=>!Gt(s,r)));return{arrayValue:{values:e}}}class Wi extends Ps{constructor(t,e){super(),this.serializer=t,this.Re=e}}class mr extends Wi{}class hs extends Wi{}class fs extends Wi{}function su(n,t,e){if(!Pe(t))return n.Re;const r=e(ds(t),ds(n.Re));return Xt(t)&&Xt(n.Re)?Qi(r):Rs(n.serializer,r)}function ds(n){return nt(n.integerValue||n.doubleValue)}function wc(n){return gn(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}function Sd(n,t){return n.field.isEqual(t.field)&&(function(r,s){return r instanceof fr&&s instanceof fr||r instanceof dr&&s instanceof dr?hn(r.elements,s.elements,Gt):r instanceof mr&&s instanceof mr||r instanceof hs&&s instanceof hs||r instanceof fs&&s instanceof fs?Gt(r.Re,s.Re):r instanceof ls&&s instanceof ls})(n.transform,t.transform)}class Cd{constructor(t,e){this.version=t,this.transformResults=e}}class Ht{constructor(t,e){this.updateTime=t,this.exists=e}static none(){return new Ht}static exists(t){return new Ht(void 0,t)}static updateTime(t){return new Ht(t)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(t){return this.exists===t.exists&&(this.updateTime?!!t.updateTime&&this.updateTime.isEqual(t.updateTime):!t.updateTime)}}function ns(n,t){return n.updateTime!==void 0?t.isFoundDocument()&&t.version.isEqual(n.updateTime):n.exists===void 0||n.exists===t.isFoundDocument()}class Ss{}function Ic(n,t){if(!n.hasLocalMutations||t&&t.fields.length===0)return null;if(t===null)return n.isNoDocument()?new Yi(n.key,Ht.none()):new Rr(n.key,n.data,Ht.none());{const e=n.data,r=Ct.empty();let s=new ct(dt.comparator);for(let o of t.fields)if(!s.has(o)){let a=e.field(o);a===null&&o.length>1&&(o=o.popLast(),a=e.field(o)),a===null?r.delete(o):r.set(o,a),s=s.add(o)}return new Oe(n.key,r,new Bt(s.toArray()),Ht.none())}}function bd(n,t,e){n instanceof Rr?(function(s,o,a){const c=s.value.clone(),h=ou(s.fieldTransforms,o,a.transformResults);c.setAll(h),o.convertToFoundDocument(a.version,c).setHasCommittedMutations()})(n,t,e):n instanceof Oe?(function(s,o,a){if(!ns(s.precondition,o))return void o.convertToUnknownDocument(a.version);const c=ou(s.fieldTransforms,o,a.transformResults),h=o.data;h.setAll(Ac(s)),h.setAll(c),o.convertToFoundDocument(a.version,h).setHasCommittedMutations()})(n,t,e):(function(s,o,a){o.convertToNoDocument(a.version).setHasCommittedMutations()})(0,t,e)}function Jn(n,t,e,r){return n instanceof Rr?(function(o,a,c,h){if(!ns(o.precondition,a))return c;const f=o.value.clone(),m=au(o.fieldTransforms,h,a);return f.setAll(m),a.convertToFoundDocument(a.version,f).setHasLocalMutations(),null})(n,t,e,r):n instanceof Oe?(function(o,a,c,h){if(!ns(o.precondition,a))return c;const f=au(o.fieldTransforms,h,a),m=a.data;return m.setAll(Ac(o)),m.setAll(f),a.convertToFoundDocument(a.version,m).setHasLocalMutations(),c===null?null:c.unionWith(o.fieldMask.fields).unionWith(o.fieldTransforms.map((p=>p.field)))})(n,t,e,r):(function(o,a,c){return ns(o.precondition,a)?(a.convertToNoDocument(a.version).setHasLocalMutations(),null):c})(n,t,e)}function xd(n,t){let e=null;for(const r of n.fieldTransforms){const s=t.data.field(r.field),o=Ec(r.transform,s||null);o!=null&&(e===null&&(e=Ct.empty()),e.set(r.field,o))}return e||null}function iu(n,t){return n.type===t.type&&!!n.key.isEqual(t.key)&&!!n.precondition.isEqual(t.precondition)&&!!(function(r,s){return r===void 0&&s===void 0||!(!r||!s)&&hn(r,s,((o,a)=>Sd(o,a)))})(n.fieldTransforms,t.fieldTransforms)&&(n.type===0?n.value.isEqual(t.value):n.type!==1||n.data.isEqual(t.data)&&n.fieldMask.isEqual(t.fieldMask))}class Rr extends Ss{constructor(t,e,r,s=[]){super(),this.key=t,this.value=e,this.precondition=r,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class Oe extends Ss{constructor(t,e,r,s,o=[]){super(),this.key=t,this.data=e,this.fieldMask=r,this.precondition=s,this.fieldTransforms=o,this.type=1}getFieldMask(){return this.fieldMask}}function Ac(n){const t=new Map;return n.fieldMask.fields.forEach((e=>{if(!e.isEmpty()){const r=n.data.field(e);t.set(e,r)}})),t}function ou(n,t,e){const r=new Map;M(n.length===e.length,32656,{Ie:e.length,Ae:n.length});for(let s=0;s<e.length;s++){const o=n[s],a=o.transform,c=t.data.field(o.field);r.set(o.field,Pd(a,c,e[s]))}return r}function au(n,t,e){const r=new Map;for(const s of n){const o=s.transform,a=e.data.field(s.field);r.set(s.field,Rd(o,a,t))}return r}class Yi extends Ss{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class Dd extends Ss{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ms{constructor(t,e){this.position=t,this.inclusive=e}}function uu(n,t,e){let r=0;for(let s=0;s<n.position.length;s++){const o=t[s],a=n.position[s];if(o.field.isKeyField()?r=F.comparator(F.fromName(a.referenceValue),e.key):r=Lt(a,e.data.field(o.field)),o.dir==="desc"&&(r*=-1),r!==0)break}return r}function cu(n,t){if(n===null)return t===null;if(t===null||n.inclusive!==t.inclusive||n.position.length!==t.position.length)return!1;for(let e=0;e<n.position.length;e++)if(!Gt(n.position[e],t.position[e]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vc{}class at extends Vc{constructor(t,e,r){super(),this.field=t,this.op=e,this.value=r}static create(t,e,r){return t.isKeyField()?e==="in"||e==="not-in"?this.createKeyFieldInFilter(t,e,r):new kd(t,e,r):e==="array-contains"?new Md(t,r):e==="in"?new Ud(t,r):e==="not-in"?new Fd(t,r):e==="array-contains-any"?new Bd(t,r):new at(t,e,r)}static createKeyFieldInFilter(t,e,r){return e==="in"?new Od(t,r):new Ld(t,r)}matches(t){const e=t.data.field(this.field);return this.op==="!="?e!==null&&e.nullValue===void 0&&this.matchesComparison(Lt(e,this.value)):e!==null&&ht(this.value)===ht(e)&&this.matchesComparison(Lt(e,this.value))}matchesComparison(t){switch(this.op){case"<":return t<0;case"<=":return t<=0;case"==":return t===0;case"!=":return t!==0;case">":return t>0;case">=":return t>=0;default:return B(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class Kt extends Vc{constructor(t,e){super(),this.filters=t,this.op=e,this.Ve=null}static create(t,e){return new Kt(t,e)}matches(t){return Rc(this)?this.filters.find((e=>!e.matches(t)))===void 0:this.filters.find((e=>e.matches(t)))!==void 0}getFlattenedFilters(){return this.Ve!==null||(this.Ve=this.filters.reduce(((t,e)=>t.concat(e.getFlattenedFilters())),[])),this.Ve}getFilters(){return Object.assign([],this.filters)}}function Rc(n){return n.op==="and"}function Pc(n){return Nd(n)&&Rc(n)}function Nd(n){for(const t of n.filters)if(t instanceof Kt)return!1;return!0}function Pi(n){if(n instanceof at)return n.field.canonicalString()+n.op.toString()+pn(n.value);if(Pc(n))return n.filters.map((t=>Pi(t))).join(",");{const t=n.filters.map((e=>Pi(e))).join(",");return`${n.op}(${t})`}}function Sc(n,t){return n instanceof at?(function(r,s){return s instanceof at&&r.op===s.op&&r.field.isEqual(s.field)&&Gt(r.value,s.value)})(n,t):n instanceof Kt?(function(r,s){return s instanceof Kt&&r.op===s.op&&r.filters.length===s.filters.length?r.filters.reduce(((o,a,c)=>o&&Sc(a,s.filters[c])),!0):!1})(n,t):void B(19439)}function Cc(n){return n instanceof at?(function(e){return`${e.field.canonicalString()} ${e.op} ${pn(e.value)}`})(n):n instanceof Kt?(function(e){return e.op.toString()+" {"+e.getFilters().map(Cc).join(" ,")+"}"})(n):"Filter"}class kd extends at{constructor(t,e,r){super(t,e,r),this.key=F.fromName(r.referenceValue)}matches(t){const e=F.comparator(t.key,this.key);return this.matchesComparison(e)}}class Od extends at{constructor(t,e){super(t,"in",e),this.keys=bc("in",e)}matches(t){return this.keys.some((e=>e.isEqual(t.key)))}}class Ld extends at{constructor(t,e){super(t,"not-in",e),this.keys=bc("not-in",e)}matches(t){return!this.keys.some((e=>e.isEqual(t.key)))}}function bc(n,t){var e;return(((e=t.arrayValue)==null?void 0:e.values)||[]).map((r=>F.fromName(r.referenceValue)))}class Md extends at{constructor(t,e){super(t,"array-contains",e)}matches(t){const e=t.data.field(this.field);return gn(e)&&hr(e.arrayValue,this.value)}}class Ud extends at{constructor(t,e){super(t,"in",e)}matches(t){const e=t.data.field(this.field);return e!==null&&hr(this.value.arrayValue,e)}}class Fd extends at{constructor(t,e){super(t,"not-in",e)}matches(t){if(hr(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const e=t.data.field(this.field);return e!==null&&e.nullValue===void 0&&!hr(this.value.arrayValue,e)}}class Bd extends at{constructor(t,e){super(t,"array-contains-any",e)}matches(t){const e=t.data.field(this.field);return!(!gn(e)||!e.arrayValue.values)&&e.arrayValue.values.some((r=>hr(this.value.arrayValue,r)))}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pr{constructor(t,e="asc"){this.field=t,this.dir=e}}function qd(n,t){return n.dir===t.dir&&n.field.isEqual(t.field)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vt{constructor(t,e,r,s,o,a,c){this.key=t,this.documentType=e,this.version=r,this.readTime=s,this.createTime=o,this.data=a,this.documentState=c}static newInvalidDocument(t){return new Vt(t,0,$.min(),$.min(),$.min(),Ct.empty(),0)}static newFoundDocument(t,e,r,s){return new Vt(t,1,e,$.min(),r,s,0)}static newNoDocument(t,e){return new Vt(t,2,e,$.min(),$.min(),Ct.empty(),0)}static newUnknownDocument(t,e){return new Vt(t,3,e,$.min(),$.min(),Ct.empty(),2)}convertToFoundDocument(t,e){return!this.createTime.isEqual($.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=t),this.version=t,this.documentType=1,this.data=e,this.documentState=0,this}convertToNoDocument(t){return this.version=t,this.documentType=2,this.data=Ct.empty(),this.documentState=0,this}convertToUnknownDocument(t){return this.version=t,this.documentType=3,this.data=Ct.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=$.min(),this}setReadTime(t){return this.readTime=t,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(t){return t instanceof Vt&&this.key.isEqual(t.key)&&this.version.isEqual(t.version)&&this.documentType===t.documentType&&this.documentState===t.documentState&&this.data.isEqual(t.data)}mutableCopy(){return new Vt(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $d{constructor(t,e=null,r=[],s=[],o=null,a=null,c=null){this.path=t,this.collectionGroup=e,this.orderBy=r,this.filters=s,this.limit=o,this.startAt=a,this.endAt=c,this.de=null}}function lu(n,t=null,e=[],r=[],s=null,o=null,a=null){return new $d(n,t,e,r,s,o,a)}function xc(n){const t=j(n);if(t.de===null){let e=t.path.canonicalString();t.collectionGroup!==null&&(e+="|cg:"+t.collectionGroup),e+="|f:",e+=t.filters.map((r=>Pi(r))).join(","),e+="|ob:",e+=t.orderBy.map((r=>(function(o){return o.field.canonicalString()+o.dir})(r))).join(","),As(t.limit)||(e+="|l:",e+=t.limit),t.startAt&&(e+="|lb:",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map((r=>pn(r))).join(",")),t.endAt&&(e+="|ub:",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map((r=>pn(r))).join(",")),t.de=e}return t.de}function Dc(n,t){if(n.limit!==t.limit||n.orderBy.length!==t.orderBy.length)return!1;for(let e=0;e<n.orderBy.length;e++)if(!qd(n.orderBy[e],t.orderBy[e]))return!1;if(n.filters.length!==t.filters.length)return!1;for(let e=0;e<n.filters.length;e++)if(!Sc(n.filters[e],t.filters[e]))return!1;return n.collectionGroup===t.collectionGroup&&!!n.path.isEqual(t.path)&&!!cu(n.startAt,t.startAt)&&cu(n.endAt,t.endAt)}function je(n){return!!n.isCorePipeline}function Nc(n){return!!n.path&&F.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class In{constructor(t,e=null,r=[],s=[],o=null,a="F",c=null,h=null){this.path=t,this.collectionGroup=e,this.explicitOrderBy=r,this.filters=s,this.limit=o,this.limitType=a,this.startAt=c,this.endAt=h,this.fe=null,this.me=null,this.pe=null,this.startAt,this.endAt}}function jd(n,t,e,r,s,o,a,c){return new In(n,t,e,r,s,o,a,c)}function Ji(n){return new In(n)}function hu(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function zd(n){return F.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}function kc(n){return n.collectionGroup!==null}function Xn(n){const t=j(n);if(t.fe===null){t.fe=[];const e=new Set;for(const o of t.explicitOrderBy)t.fe.push(o),e.add(o.field.canonicalString());const r=t.explicitOrderBy.length>0?t.explicitOrderBy[t.explicitOrderBy.length-1].dir:"asc";(function(a){let c=new ct(dt.comparator);return a.filters.forEach((h=>{h.getFlattenedFilters().forEach((f=>{f.isInequality()&&(c=c.add(f.field))}))})),c})(t).forEach((o=>{e.has(o.canonicalString())||o.isKeyField()||t.fe.push(new pr(o,r))})),e.has(dt.keyField().canonicalString())||t.fe.push(new pr(dt.keyField(),r))}return t.fe}function Zt(n){const t=j(n);return t.me||(t.me=Gd(t,Xn(n))),t.me}function Gd(n,t){if(n.limitType==="F")return lu(n.path,n.collectionGroup,t,n.filters,n.limit,n.startAt,n.endAt);{t=t.map((s=>{const o=s.dir==="desc"?"asc":"desc";return new pr(s.field,o)}));const e=n.endAt?new ms(n.endAt.position,n.endAt.inclusive):null,r=n.startAt?new ms(n.startAt.position,n.startAt.inclusive):null;return lu(n.path,n.collectionGroup,t,n.filters,n.limit,e,r)}}function Si(n,t){const e=n.filters.concat([t]);return new In(n.path,n.collectionGroup,n.explicitOrderBy.slice(),e,n.limit,n.limitType,n.startAt,n.endAt)}function Hd(n,t){const e=n.explicitOrderBy.concat([t]);return new In(n.path,n.collectionGroup,e,n.filters.slice(),n.limit,n.limitType,n.startAt,n.endAt)}function Ci(n,t,e){return new In(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),t,e,n.startAt,n.endAt)}function Qd(n,t){return Dc(Zt(n),Zt(t))&&n.limitType===t.limitType}function Zn(n){return`Query(target=${(function(e){let r=e.path.canonicalString();return e.collectionGroup!==null&&(r+=" collectionGroup="+e.collectionGroup),e.filters.length>0&&(r+=`, filters: [${e.filters.map((s=>Cc(s))).join(", ")}]`),As(e.limit)||(r+=", limit: "+e.limit),e.orderBy.length>0&&(r+=`, orderBy: [${e.orderBy.map((s=>(function(a){return`${a.field.canonicalString()} (${a.dir})`})(s))).join(", ")}]`),e.startAt&&(r+=", startAt: ",r+=e.startAt.inclusive?"b:":"a:",r+=e.startAt.position.map((s=>pn(s))).join(",")),e.endAt&&(r+=", endAt: ",r+=e.endAt.inclusive?"a:":"b:",r+=e.endAt.position.map((s=>pn(s))).join(",")),`Target(${r})`})(Zt(n))}; limitType=${n.limitType})`}function Cs(n,t){return t.isFoundDocument()&&(function(r,s){const o=s.key.path;return r.collectionGroup!==null?s.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(o):F.isDocumentKey(r.path)?r.path.isEqual(o):r.path.isImmediateParentOf(o)})(n,t)&&(function(r,s){for(const o of Xn(r))if(!o.field.isKeyField()&&s.data.field(o.field)===null)return!1;return!0})(n,t)&&(function(r,s){for(const o of r.filters)if(!o.matches(s))return!1;return!0})(n,t)&&(function(r,s){return!(r.startAt&&!(function(a,c,h){const f=uu(a,c,h);return a.inclusive?f<=0:f<0})(r.startAt,Xn(r),s)||r.endAt&&!(function(a,c,h){const f=uu(a,c,h);return a.inclusive?f>=0:f>0})(r.endAt,Xn(r),s))})(n,t)}function Xi(n){return(t,e)=>{let r=!1;for(const s of Xn(n)){const o=Kd(s,t,e);if(o!==0)return o;r=r||s.field.isKeyField()}return 0}}function Kd(n,t,e){const r=n.field.isKeyField()?F.comparator(t.key,e.key):(function(o,a,c){const h=a.data.field(o),f=c.data.field(o);return h!==null&&f!==null?Lt(h,f):B(42886)})(n.field,t,e);switch(n.dir){case"asc":return r;case"desc":return-1*r;default:return B(19790,{direction:n.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wd{constructor(t,e){this.count=t,this.unchangedNames=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ot,K;function Yd(n){switch(n){case S.OK:return B(64938);case S.CANCELLED:case S.UNKNOWN:case S.DEADLINE_EXCEEDED:case S.RESOURCE_EXHAUSTED:case S.INTERNAL:case S.UNAVAILABLE:case S.UNAUTHENTICATED:return!1;case S.INVALID_ARGUMENT:case S.NOT_FOUND:case S.ALREADY_EXISTS:case S.PERMISSION_DENIED:case S.FAILED_PRECONDITION:case S.ABORTED:case S.OUT_OF_RANGE:case S.UNIMPLEMENTED:case S.DATA_LOSS:return!0;default:return B(15467,{code:n})}}function Oc(n){if(n===void 0)return ce("GRPC error has no .code"),S.UNKNOWN;switch(n){case ot.OK:return S.OK;case ot.CANCELLED:return S.CANCELLED;case ot.UNKNOWN:return S.UNKNOWN;case ot.DEADLINE_EXCEEDED:return S.DEADLINE_EXCEEDED;case ot.RESOURCE_EXHAUSTED:return S.RESOURCE_EXHAUSTED;case ot.INTERNAL:return S.INTERNAL;case ot.UNAVAILABLE:return S.UNAVAILABLE;case ot.UNAUTHENTICATED:return S.UNAUTHENTICATED;case ot.INVALID_ARGUMENT:return S.INVALID_ARGUMENT;case ot.NOT_FOUND:return S.NOT_FOUND;case ot.ALREADY_EXISTS:return S.ALREADY_EXISTS;case ot.PERMISSION_DENIED:return S.PERMISSION_DENIED;case ot.FAILED_PRECONDITION:return S.FAILED_PRECONDITION;case ot.ABORTED:return S.ABORTED;case ot.OUT_OF_RANGE:return S.OUT_OF_RANGE;case ot.UNIMPLEMENTED:return S.UNIMPLEMENTED;case ot.DATA_LOSS:return S.DATA_LOSS;default:return B(39323,{code:n})}}(K=ot||(ot={}))[K.OK=0]="OK",K[K.CANCELLED=1]="CANCELLED",K[K.UNKNOWN=2]="UNKNOWN",K[K.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",K[K.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",K[K.NOT_FOUND=5]="NOT_FOUND",K[K.ALREADY_EXISTS=6]="ALREADY_EXISTS",K[K.PERMISSION_DENIED=7]="PERMISSION_DENIED",K[K.UNAUTHENTICATED=16]="UNAUTHENTICATED",K[K.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",K[K.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",K[K.ABORTED=10]="ABORTED",K[K.OUT_OF_RANGE=11]="OUT_OF_RANGE",K[K.UNIMPLEMENTED=12]="UNIMPLEMENTED",K[K.INTERNAL=13]="INTERNAL",K[K.UNAVAILABLE=14]="UNAVAILABLE",K[K.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ye{constructor(t,e){this.mapKeyFn=t,this.equalsFn=e,this.inner={},this.innerSize=0}get(t){const e=this.mapKeyFn(t),r=this.inner[e];if(r!==void 0){for(const[s,o]of r)if(this.equalsFn(s,t))return o}}has(t){return this.get(t)!==void 0}set(t,e){const r=this.mapKeyFn(t),s=this.inner[r];if(s===void 0)return this.inner[r]=[[t,e]],void this.innerSize++;for(let o=0;o<s.length;o++)if(this.equalsFn(s[o][0],t))return void(s[o]=[t,e]);s.push([t,e]),this.innerSize++}delete(t){const e=this.mapKeyFn(t),r=this.inner[e];if(r===void 0)return!1;for(let s=0;s<r.length;s++)if(this.equalsFn(r[s][0],t))return r.length===1?delete this.inner[e]:r.splice(s,1),this.innerSize--,!0;return!1}forEach(t){ke(this.inner,((e,r)=>{for(const[s,o]of r)t(s,o)}))}isEmpty(){return lc(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jd=new et(F.comparator);function Nt(){return Jd}const Lc=new et(F.comparator);function sn(...n){let t=Lc;for(const e of n)t=t.insert(e.key,e);return t}function Mc(n){let t=Lc;return n.forEach(((e,r)=>t=t.insert(e,r.overlayedDocument))),t}function _e(){return tr()}function Uc(){return tr()}function tr(){return new Ye((n=>n.toString()),((n,t)=>n.isEqual(t)))}const Xd=new et(F.comparator),Zd=new ct(F.comparator);function G(...n){let t=Zd;for(const e of n)t=t.add(e);return t}const tm=new ct(H);function em(){return tm}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function nm(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rm=new Ee([4294967295,4294967295],0);function fu(n){const t=nm().encode(n),e=new tc;return e.update(t),new Uint8Array(e.digest())}function du(n){const t=new DataView(n.buffer),e=t.getUint32(0,!0),r=t.getUint32(4,!0),s=t.getUint32(8,!0),o=t.getUint32(12,!0);return[new Ee([e,r],0),new Ee([s,o],0)]}class Zi{constructor(t,e,r){if(this.bitmap=t,this.padding=e,this.hashCount=r,e<0||e>=8)throw new Qn(`Invalid padding: ${e}`);if(r<0)throw new Qn(`Invalid hash count: ${r}`);if(t.length>0&&this.hashCount===0)throw new Qn(`Invalid hash count: ${r}`);if(t.length===0&&e!==0)throw new Qn(`Invalid padding when bitmap length is 0: ${e}`);this.ge=8*t.length-e,this.ye=Ee.fromNumber(this.ge)}we(t,e,r){let s=t.add(e.multiply(Ee.fromNumber(r)));return s.compare(rm)===1&&(s=new Ee([s.getBits(0),s.getBits(1)],0)),s.modulo(this.ye).toNumber()}be(t){return!!(this.bitmap[Math.floor(t/8)]&1<<t%8)}mightContain(t){if(this.ge===0)return!1;const e=fu(t),[r,s]=du(e);for(let o=0;o<this.hashCount;o++){const a=this.we(r,s,o);if(!this.be(a))return!1}return!0}static create(t,e,r){const s=t%8==0?0:8-t%8,o=new Uint8Array(Math.ceil(t/8)),a=new Zi(o,s,e);return r.forEach((c=>a.insert(c))),a}insert(t){if(this.ge===0)return;const e=fu(t),[r,s]=du(e);for(let o=0;o<this.hashCount;o++){const a=this.we(r,s,o);this.ve(a)}}ve(t){const e=Math.floor(t/8),r=t%8;this.bitmap[e]|=1<<r}}class Qn extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pr{constructor(t,e,r,s,o,a){this.snapshotVersion=t,this.targetChanges=e,this.targetMismatches=r,this.documentUpdates=s,this.augmentedDocumentUpdates=o,this.resolvedLimboDocuments=a}static createSynthesizedRemoteEventForCurrentChange(t,e,r){const s=new Map;return s.set(t,Sr.createSynthesizedTargetChangeForCurrentChange(t,e,r)),new Pr($.min(),s,new et(H),Nt(),Nt(),G())}}class Sr{constructor(t,e,r,s,o){this.resumeToken=t,this.current=e,this.addedDocuments=r,this.modifiedDocuments=s,this.removedDocuments=o}static createSynthesizedTargetChangeForCurrentChange(t,e,r){return new Sr(r,e,G(),G(),G())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rs{constructor(t,e,r,s){this.Se=t,this.removedTargetIds=e,this.key=r,this.De=s}}class Fc{constructor(t,e){this.targetId=t,this.xe=e}}class Bc{constructor(t,e,r=lt.EMPTY_BYTE_STRING,s=null){this.state=t,this.targetIds=e,this.resumeToken=r,this.cause=s}}class mu{constructor(t){this.targetId=t,this.Ce=0,this.Fe=pu(),this.Oe=lt.EMPTY_BYTE_STRING,this.Me=!1,this.Ne=!0}get current(){return this.Me}get resumeToken(){return this.Oe}get Le(){return this.Ce!==0}get Be(){return this.Ne}Ue(t){t.approximateByteSize()>0&&(this.Ne=!0,this.Oe=t)}ke(){let t=G(),e=G(),r=G();return this.Fe.forEach(((s,o)=>{switch(o){case 0:t=t.add(s);break;case 2:e=e.add(s);break;case 1:r=r.add(s);break;default:B(38017,{changeType:o})}})),new Sr(this.Oe,this.Me,t,e,r)}qe(){this.Ne=!1,this.Fe=pu()}$e(t,e){this.Ne=!0,this.Fe=this.Fe.insert(t,e)}Ke(t){this.Ne=!0,this.Fe=this.Fe.remove(t)}We(){this.Ce+=1}Qe(){this.Ce-=1,M(this.Ce>=0,3241,{Ce:this.Ce,targetId:this.targetId})}Ge(){this.Ne=!0,this.Me=!0}}const zn="WatchChangeAggregator";class sm{constructor(t){this.ze=t,this.je=new Map,this.He=Nt(),this.Je=Jr(),this.Ye=Nt(),this.Ze=Jr(),this.Xe=new et(H)}et(t){for(const e of t.Se)t.De&&t.De.isFoundDocument()?this.tt(e,t.De):this.nt(e,t.key,t.De);for(const e of t.removedTargetIds)this.nt(e,t.key,t.De)}rt(t){this.forEachTarget(t,(e=>{const r=this.je.get(e);if(r)switch(t.state){case 0:this.it(e)&&r.Ue(t.resumeToken);break;case 1:r.Qe(),r.Le||r.qe(),r.Ue(t.resumeToken);break;case 2:r.Qe(),r.Le||this.removeTarget(e);break;case 3:this.it(e)&&(r.Ge(),r.Ue(t.resumeToken));break;case 4:this.it(e)&&(this.st(e),r.Ue(t.resumeToken));break;default:B(56790,{state:t.state})}else O(zn,`handleTargetChange received targetChange for untracked target ID (${e}) with state (${t.state})`)}))}forEachTarget(t,e){t.targetIds.length>0?t.targetIds.forEach(e):this.je.forEach(((r,s)=>{this.it(s)&&e(s)}))}_t(t){var e;return je(t)?t.getPipelineSourceType()==="documents"&&((e=t.getPipelineDocuments())==null?void 0:e.length)===1:Nc(t)}ot(t){const e=t.targetId,r=t.xe.count,s=this.ut(e);if(s){const o=s.target;if(this._t(o))if(r===0){const a=new F(je(o)?Y.fromString(o.getPipelineDocuments()[0]):o.path);this.nt(e,a,Vt.newNoDocument(a,$.min()))}else M(r===1,20013,"Single document existence filter with count: "+r);else{const a=this.ct(e);if(a!==r){const c=this.lt(t),h=c?this.Et(c,t,a):1;if(h!==0){this.st(e);const f=h===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Xe=this.Xe.insert(e,f)}}}}}lt(t){const e=t.xe.unchangedNames;if(!e||!e.bits)return null;const{bits:{bitmap:r="",padding:s=0},hashCount:o=0}=e;let a,c;try{a=Re(r).toUint8Array()}catch(h){if(h instanceof hc)return Qt("Decoding the base64 bloom filter in existence filter failed ("+h.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw h}try{c=new Zi(a,s,o)}catch(h){return Qt(h instanceof Qn?"BloomFilter error: ":"Applying bloom filter failed: ",h),null}return c.ge===0?null:c}Et(t,e,r){return e.xe.count===r-this.Pt(t,e.targetId)?0:2}Pt(t,e){const r=this.ze.getRemoteKeysForTarget(e);let s=0;return r.forEach((o=>{const a=this.ze.Tt(),c=`projects/${a.projectId}/databases/${a.database}/documents/${o.path.canonicalString()}`;t.mightContain(c)||(this.nt(e,o,null),s++)})),s}Rt(t){const e=new Map;this.je.forEach(((o,a)=>{const c=this.ut(a);if(c){if(o.current&&this._t(c.target)){const h=je(c.target)?Y.fromString(c.target.getPipelineDocuments()[0]):c.target.path,f=new F(h);this.It(f).has(a)||this.At(a,f)||this.nt(a,f,Vt.newNoDocument(f,t))}o.Be&&(e.set(a,o.ke()),o.qe())}}));let r=G();this.Ze.forEach(((o,a)=>{let c=!0;a.forEachWhile((h=>{const f=this.ut(h);return!f||f.purpose==="TargetPurposeLimboResolution"||(c=!1,!1)})),c&&(r=r.add(o))})),this.He.forEach(((o,a)=>a.setReadTime(t))),this.Ye.forEach(((o,a)=>a.setReadTime(t)));const s=new Pr(t,e,this.Xe,this.He,this.Ye,r);return this.He=Nt(),this.Je=Jr(),this.Ye=Nt(),this.Ze=Jr(),this.Xe=new et(H),s}tt(t,e){const r=this.je.get(t);if(!r||!this.it(t))return void O(zn,`addDocumentToTarget received document for unknown inactive target (${t})`);const s=this.At(t,e.key)?2:0;r.$e(e.key,s),je(this.ut(t).target)&&this.ut(t).target.getPipelineFlavor()!=="exact"?this.Ye=this.Ye.insert(e.key,e):this.He=this.He.insert(e.key,e),this.Je=this.Je.insert(e.key,this.It(e.key).add(t)),this.Ze=this.Ze.insert(e.key,this.Vt(e.key).add(t))}nt(t,e,r){const s=this.je.get(t);s&&this.it(t)?(this.At(t,e)?s.$e(e,1):s.Ke(e),this.Ze=this.Ze.insert(e,this.Vt(e).delete(t)),this.Ze=this.Ze.insert(e,this.Vt(e).add(t)),r&&(je(this.ut(t).target)&&this.ut(t).target.getPipelineFlavor()!=="exact"?this.Ye=this.Ye.insert(e,r):this.He=this.He.insert(e,r))):O(zn,`removeDocumentFromTarget received document for unknown or inactive target (${t})`)}removeTarget(t){this.je.delete(t)}ct(t){const e=this.je.get(t);if(!e)return 0;const r=e.ke();return this.ze.getRemoteKeysForTarget(t).size+r.addedDocuments.size-r.removedDocuments.size}We(t){let e=this.je.get(t);e||(O(zn,`recordPendingTargetRequest set up tracking for target ID ${t}`),e=new mu(t),this.je.set(t,e)),e.We()}Vt(t){let e=this.Ze.get(t);return e||(e=new ct(H),this.Ze=this.Ze.insert(t,e)),e}It(t){let e=this.Je.get(t);return e||(e=new ct(H),this.Je=this.Je.insert(t,e)),e}it(t){const e=this.ut(t)!==null;return e||O(zn,"Detected inactive target",t),e}ut(t){const e=this.je.get(t);return e===void 0||e.Le?null:this.ze.dt(t)}st(t){this.je.set(t,new mu(t)),this.ze.getRemoteKeysForTarget(t).forEach((e=>{this.nt(t,e,null)}))}At(t,e){return this.ze.getRemoteKeysForTarget(t).has(e)}}function Jr(){return new et(F.comparator)}function pu(){return new et(F.comparator)}const im={asc:"ASCENDING",desc:"DESCENDING"},om={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},am={and:"AND",or:"OR"};class um{constructor(t,e){this.databaseId=t,this.useProto3Json=e}}function bi(n,t){return n.useProto3Json||As(t)?t:{value:t}}function ps(n,t){return n.useProto3Json?`${new Date(1e3*t.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+t.nanoseconds).slice(-9)}Z`:{seconds:""+t.seconds,nanos:t.nanoseconds}}function to(n){const t=Ve(n);return new tt(t.seconds,t.nanos)}function qc(n,t){return n.useProto3Json?t.toBase64():t.toUint8Array()}function ss(n,t){return ps(n,t.toTimestamp())}function te(n){return M(!!n,49232),$.fromTimestamp(to(n))}function eo(n,t){return xi(n,t).canonicalString()}function xi(n,t){const e=(function(s){return new Y(["projects",s.projectId,"databases",s.database])})(n).child("documents");return t===void 0?e:e.child(t)}function $c(n){const t=Y.fromString(n);return M(Qc(t),10190,{key:t.toString()}),t}function gs(n,t){return eo(n.databaseId,t.path)}function mi(n,t){const e=$c(t);if(e.get(1)!==n.databaseId.projectId)throw new k(S.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+e.get(1)+" vs "+n.databaseId.projectId);if(e.get(3)!==n.databaseId.database)throw new k(S.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+e.get(3)+" vs "+n.databaseId.database);return new F(zc(e))}function jc(n,t){return eo(n.databaseId,t)}function cm(n){const t=$c(n);return t.length===4?Y.emptyPath():zc(t)}function Di(n){return new Y(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function zc(n){return M(n.length>4&&n.get(4)==="documents",29091,{key:n.toString()}),n.popFirst(5)}function gu(n,t,e){return{name:gs(n,t),fields:e.value.mapValue.fields}}function lm(n,t){let e;if("targetChange"in t){t.targetChange;const r=(function(f){return f==="NO_CHANGE"?0:f==="ADD"?1:f==="REMOVE"?2:f==="CURRENT"?3:f==="RESET"?4:B(39313,{state:f})})(t.targetChange.targetChangeType||"NO_CHANGE"),s=t.targetChange.targetIds||[],o=(function(f,m){return f.useProto3Json?(M(m===void 0||typeof m=="string",58123),lt.fromBase64String(m||"")):(M(m===void 0||m instanceof Buffer||m instanceof Uint8Array,16193),lt.fromUint8Array(m||new Uint8Array))})(n,t.targetChange.resumeToken),a=t.targetChange.cause,c=a&&(function(f){const m=f.code===void 0?S.UNKNOWN:Oc(f.code);return new k(m,f.message||"")})(a);e=new Bc(r,s,o,c||null)}else if("documentChange"in t){t.documentChange;const r=t.documentChange;r.document,r.document.name,r.document.updateTime;const s=mi(n,r.document.name),o=te(r.document.updateTime),a=r.document.createTime?te(r.document.createTime):$.min(),c=new Ct({mapValue:{fields:r.document.fields}}),h=Vt.newFoundDocument(s,o,a,c),f=r.targetIds||[],m=r.removedTargetIds||[];e=new rs(f,m,h.key,h)}else if("documentDelete"in t){t.documentDelete;const r=t.documentDelete;r.document;const s=mi(n,r.document),o=r.readTime?te(r.readTime):$.min(),a=Vt.newNoDocument(s,o),c=r.removedTargetIds||[];e=new rs([],c,a.key,a)}else if("documentRemove"in t){t.documentRemove;const r=t.documentRemove;r.document;const s=mi(n,r.document),o=r.removedTargetIds||[];e=new rs([],o,s,null)}else{if(!("filter"in t))return B(11601,{ft:t});{t.filter;const r=t.filter;r.targetId;const{count:s=0,unchangedNames:o}=r,a=new Wd(s,o),c=r.targetId;e=new Fc(c,a)}}return e}function hm(n,t){let e;if(t instanceof Rr)e={update:gu(n,t.key,t.value)};else if(t instanceof Yi)e={delete:gs(n,t.key)};else if(t instanceof Oe)e={update:gu(n,t.key,t.data),updateMask:vm(t.fieldMask)};else{if(!(t instanceof Dd))return B(16599,{gt:t.type});e={verify:gs(n,t.key)}}return t.fieldTransforms.length>0&&(e.updateTransforms=t.fieldTransforms.map((r=>(function(o,a){const c=a.transform;if(c instanceof ls)return{fieldPath:a.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(c instanceof fr)return{fieldPath:a.field.canonicalString(),appendMissingElements:{values:c.elements}};if(c instanceof dr)return{fieldPath:a.field.canonicalString(),removeAllFromArray:{values:c.elements}};if(c instanceof mr)return{fieldPath:a.field.canonicalString(),increment:c.Re};if(c instanceof hs)return{fieldPath:a.field.canonicalString(),minimum:c.Re};if(c instanceof fs)return{fieldPath:a.field.canonicalString(),maximum:c.Re};throw B(20930,{transform:a.transform})})(0,r)))),t.precondition.isNone||(e.currentDocument=(function(s,o){return o.updateTime!==void 0?{updateTime:ss(s,o.updateTime)}:o.exists!==void 0?{exists:o.exists}:B(27497)})(n,t.precondition)),e}function fm(n,t){return n&&n.length>0?(M(t!==void 0,14353),n.map((e=>(function(s,o){let a=s.updateTime?te(s.updateTime):te(o);return a.isEqual($.min())&&(a=te(o)),new Cd(a,s.transformResults||[])})(e,t)))):[]}function dm(n,t){return{documents:[jc(n,t.path)]}}function mm(n,t){const e={structuredQuery:{}},r=t.path;let s;t.collectionGroup!==null?(s=r,e.structuredQuery.from=[{collectionId:t.collectionGroup,allDescendants:!0}]):(s=r.popLast(),e.structuredQuery.from=[{collectionId:r.lastSegment()}]),e.parent=jc(n,s);const o=(function(f){if(f.length!==0)return Hc(Kt.create(f,"and"))})(t.filters);o&&(e.structuredQuery.where=o);const a=(function(f){if(f.length!==0)return f.map((m=>(function(I){return{field:on(I.field),direction:ym(I.dir)}})(m)))})(t.orderBy);a&&(e.structuredQuery.orderBy=a);const c=bi(n,t.limit);return c!==null&&(e.structuredQuery.limit=c),t.startAt&&(e.structuredQuery.startAt=(function(f){return{before:f.inclusive,values:f.position}})(t.startAt)),t.endAt&&(e.structuredQuery.endAt=(function(f){return{before:!f.inclusive,values:f.position}})(t.endAt)),{yt:e,parent:s}}function pm(n){let t=cm(n.parent);const e=n.structuredQuery,r=e.from?e.from.length:0;let s=null;if(r>0){M(r===1,65062);const m=e.from[0];m.allDescendants?s=m.collectionId:t=t.child(m.collectionId)}let o=[];e.where&&(o=(function(p){const I=Gc(p);return I instanceof Kt&&Pc(I)?I.getFilters():[I]})(e.where));let a=[];e.orderBy&&(a=(function(p){return p.map((I=>(function(x){return new pr(an(x.field),(function(L){switch(L){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(x.direction))})(I)))})(e.orderBy));let c=null;e.limit&&(c=(function(p){let I;return I=typeof p=="object"?p.value:p,As(I)?null:I})(e.limit));let h=null;e.startAt&&(h=(function(p){const I=!!p.before,b=p.values||[];return new ms(b,I)})(e.startAt));let f=null;return e.endAt&&(f=(function(p){const I=!p.before,b=p.values||[];return new ms(b,I)})(e.endAt)),jd(t,s,a,o,c,"F",h,f)}function gm(n,t){const e=(function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return B(28987,{purpose:s})}})(t.purpose);return e==null?null:{"goog-listen-tags":e}}function _m(n,t){return{structuredPipeline:{pipeline:{stages:t.stages.map((e=>e._toProto(n)))}}}}function Gc(n){return n.unaryFilter!==void 0?(function(e){switch(e.unaryFilter.op){case"IS_NAN":const r=an(e.unaryFilter.field);return at.create(r,"==",{doubleValue:NaN});case"IS_NULL":const s=an(e.unaryFilter.field);return at.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const o=an(e.unaryFilter.field);return at.create(o,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const a=an(e.unaryFilter.field);return at.create(a,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return B(61313);default:return B(60726)}})(n):n.fieldFilter!==void 0?(function(e){return at.create(an(e.fieldFilter.field),(function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return B(58110);default:return B(50506)}})(e.fieldFilter.op),e.fieldFilter.value)})(n):n.compositeFilter!==void 0?(function(e){return Kt.create(e.compositeFilter.filters.map((r=>Gc(r))),(function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return B(1026)}})(e.compositeFilter.op))})(n):B(30097,{filter:n})}function ym(n){return im[n]}function Em(n){return om[n]}function Tm(n){return am[n]}function on(n){return{fieldPath:n.canonicalString()}}function an(n){return dt.fromServerFormat(n.fieldPath)}function Hc(n){return n instanceof at?(function(e){if(e.op==="=="){if(Mt(e.value))return{unaryFilter:{field:on(e.field),op:"IS_NAN"}};if(qt(e.value))return{unaryFilter:{field:on(e.field),op:"IS_NULL"}}}else if(e.op==="!="){if(Mt(e.value))return{unaryFilter:{field:on(e.field),op:"IS_NOT_NAN"}};if(qt(e.value))return{unaryFilter:{field:on(e.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:on(e.field),op:Em(e.op),value:e.value}}})(n):n instanceof Kt?(function(e){const r=e.getFilters().map((s=>Hc(s)));return r.length===1?r[0]:{compositeFilter:{op:Tm(e.op),filters:r}}})(n):B(54877,{filter:n})}function vm(n){const t=[];return n.fields.forEach((e=>t.push(e.canonicalString()))),{fieldPaths:t}}function Qc(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}function Kc(n){return!!n&&typeof n._toProto=="function"&&n._protoValueType==="ProtoValue"}function gr(n,t){const e={fields:{}};return t.forEach(((r,s)=>{if(typeof s!="string")throw new Error(`Cannot encode map with non-string key: ${s}`);e.fields[s]=r._toProto(n)})),{mapValue:e}}function Wc(n){return{stringValue:n}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bs(n){return new um(n,!0)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zt{constructor(t){this._byteString=t}static fromBase64String(t){try{return new zt(lt.fromBase64String(t))}catch(e){throw new k(S.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+e)}}static fromUint8Array(t){return new zt(lt.fromUint8Array(t))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(t){return this._byteString.isEqual(t._byteString)}toJSON(){return{type:zt._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(t){if(Ar(t,zt._jsonSchema))return zt.fromBase64String(t.bytes)}}zt._jsonSchemaVersion="firestore/bytes/1.0",zt._jsonSchema={type:ut("string",zt._jsonSchemaVersion),bytes:ut("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xs{constructor(...t){for(let e=0;e<t.length;++e)if(t[e].length===0)throw new k(S.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new dt(t)}isEqual(t){return this._internalPath.isEqual(t._internalPath)}}function wm(){return new xs(fn)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class no{constructor(t){this._methodName=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ee{constructor(t,e){if(!isFinite(t)||t<-90||t>90)throw new k(S.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+t);if(!isFinite(e)||e<-180||e>180)throw new k(S.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+e);this._lat=t,this._long=e}get latitude(){return this._lat}get longitude(){return this._long}isEqual(t){return this._lat===t._lat&&this._long===t._long}_compareTo(t){return H(this._lat,t._lat)||H(this._long,t._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:ee._jsonSchemaVersion}}static fromJSON(t){if(Ar(t,ee._jsonSchema))return new ee(t.latitude,t.longitude)}}function Yc(n){const t={};return n.timeoutSeconds!==void 0&&(t.timeoutSeconds=n.timeoutSeconds),t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ee._jsonSchemaVersion="firestore/geoPoint/1.0",ee._jsonSchema={type:ut("string",ee._jsonSchemaVersion),latitude:ut("number"),longitude:ut("number")};class Im{bt(t){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _u="ConnectivityMonitor";class yu{constructor(){this.vt=()=>this.St(),this.Dt=()=>this.xt(),this.Ct=[],this.Ft()}bt(t){this.Ct.push(t)}shutdown(){window.removeEventListener("online",this.vt),window.removeEventListener("offline",this.Dt)}Ft(){window.addEventListener("online",this.vt),window.addEventListener("offline",this.Dt)}St(){O(_u,"Network connectivity changed: AVAILABLE");for(const t of this.Ct)t(0)}xt(){O(_u,"Network connectivity changed: UNAVAILABLE");for(const t of this.Ct)t(1)}static C(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Xr=null;function Ni(){return Xr===null?Xr=(function(){return 268435456+Math.round(2147483648*Math.random())})():Xr++,"0x"+Xr.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pi="RestConnection",Am={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class Vm{get Ot(){return!1}constructor(t){this.databaseInfo=t,this.databaseId=t.databaseId;const e=t.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Mt=e+"://"+t.host,this.Nt=`projects/${r}/databases/${s}`,this.Lt=this.databaseId.database===ur?`project_id=${r}`:`project_id=${r}&database_id=${s}`}Bt(t,e,r,s,o){const a=Ni(),c=this.Ut(t,e.toUriEncodedString());O(pi,`Sending RPC '${t}' ${a}:`,c,r);const h={"google-cloud-resource-prefix":this.Nt,"x-goog-request-params":this.Lt};this.kt(h,s,o);const{host:f}=new URL(c),m=ji(f);return this.qt(t,c,h,r,m).then((p=>(O(pi,`Received RPC '${t}' ${a}: `,p),p)),(p=>{throw Qt(pi,`RPC '${t}' ${a} failed with error: `,p,"url: ",c,"request:",r),p}))}$t(t,e,r,s,o,a){return this.Bt(t,e,r,s,o)}kt(t,e,r){t["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+Tn})(),t["Content-Type"]="text/plain",this.databaseInfo.appId&&(t["X-Firebase-GMPID"]=this.databaseInfo.appId),e&&e.headers.forEach(((s,o)=>t[o]=s)),r&&r.headers.forEach(((s,o)=>t[o]=s))}Ut(t,e){const r=Am[t];let s=`${this.Mt}/v1/${e}:${r}`;return this.databaseInfo.apiKey&&(s=`${s}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),s}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rm{constructor(t){this.Kt=t.Kt,this.Wt=t.Wt}Qt(t){this.Gt=t}zt(t){this.jt=t}Ht(t){this.Jt=t}onMessage(t){this.Yt=t}close(){this.Wt()}send(t){this.Kt(t)}Zt(){this.Gt()}Xt(){this.jt()}en(t){this.Jt(t)}tn(t){this.Yt(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const It="WebChannelConnection",Gn=(n,t,e)=>{n.listen(t,(r=>{try{e(r)}catch(s){setTimeout((()=>{throw s}),0)}}))};class cn extends Vm{constructor(t){super(t),this.nn=[],this.forceLongPolling=t.forceLongPolling,this.autoDetectLongPolling=t.autoDetectLongPolling,this.useFetchStreams=t.useFetchStreams,this.longPollingOptions=t.longPollingOptions}static rn(){if(!cn.sn){const t=sc();Gn(t,rc.STAT_EVENT,(e=>{e.stat===Ii.PROXY?O(It,"STAT_EVENT: detected buffering proxy"):e.stat===Ii.NOPROXY&&O(It,"STAT_EVENT: detected no buffering proxy")})),cn.sn=!0}}qt(t,e,r,s,o){const a=Ni();return new Promise(((c,h)=>{const f=new ec;f.setWithCredentials(!0),f.listenOnce(nc.COMPLETE,(()=>{try{switch(f.getLastErrorCode()){case ts.NO_ERROR:const p=f.getResponseJson();O(It,`XHR for RPC '${t}' ${a} received:`,JSON.stringify(p)),c(p);break;case ts.TIMEOUT:O(It,`RPC '${t}' ${a} timed out`),h(new k(S.DEADLINE_EXCEEDED,"Request time out"));break;case ts.HTTP_ERROR:const I=f.getStatus();if(O(It,`RPC '${t}' ${a} failed with status:`,I,"response text:",f.getResponseText()),I>0){let b=f.getResponseJson();Array.isArray(b)&&(b=b[0]);const x=b==null?void 0:b.error;if(x&&x.status&&x.message){const U=(function(Q){const J=Q.toLowerCase().replace(/_/g,"-");return Object.values(S).indexOf(J)>=0?J:S.UNKNOWN})(x.status);h(new k(U,x.message))}else h(new k(S.UNKNOWN,"Server responded with status "+f.getStatus()))}else h(new k(S.UNAVAILABLE,"Connection failed."));break;default:B(9055,{_n:t,streamId:a,an:f.getLastErrorCode(),un:f.getLastError()})}}finally{O(It,`RPC '${t}' ${a} completed.`)}}));const m=JSON.stringify(s);O(It,`RPC '${t}' ${a} sending request:`,s),f.send(e,"POST",m,r,15)}))}cn(t,e,r){const s=Ni(),o=[this.Mt,"/","google.firestore.v1.Firestore","/",t,"/channel"],a=this.createWebChannelTransport(),c={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},h=this.longPollingOptions.timeoutSeconds;h!==void 0&&(c.longPollingTimeout=Math.round(1e3*h)),this.useFetchStreams&&(c.useFetchStreams=!0),this.kt(c.initMessageHeaders,e,r),c.encodeInitMessageHeaders=!0;const f=o.join("");O(It,`Creating RPC '${t}' stream ${s}: ${f}`,c);const m=a.createWebChannel(f,c);this.En(m);let p=!1,I=!1;const b=new Rm({Kt:x=>{I?O(It,`Not sending because RPC '${t}' stream ${s} is closed:`,x):(p||(O(It,`Opening RPC '${t}' stream ${s} transport.`),m.open(),p=!0),O(It,`RPC '${t}' stream ${s} sending:`,x),m.send(x))},Wt:()=>m.close()});return Gn(m,Hn.EventType.OPEN,(()=>{I||(O(It,`RPC '${t}' stream ${s} transport opened.`),b.Zt())})),Gn(m,Hn.EventType.CLOSE,(()=>{I||(I=!0,O(It,`RPC '${t}' stream ${s} transport closed`),b.en(),this.hn(m))})),Gn(m,Hn.EventType.ERROR,(x=>{I||(I=!0,Qt(It,`RPC '${t}' stream ${s} transport errored. Name:`,x.name,"Message:",x.message),b.en(new k(S.UNAVAILABLE,"The operation could not be completed")))})),Gn(m,Hn.EventType.MESSAGE,(x=>{var U;if(!I){const L=x.data[0];M(!!L,16349);const Q=L,J=(Q==null?void 0:Q.error)||((U=Q[0])==null?void 0:U.error);if(J){O(It,`RPC '${t}' stream ${s} received error:`,J);const rt=J.status;let jt=(function(v){const g=ot[v];if(g!==void 0)return Oc(g)})(rt),Tt=J.message;rt==="NOT_FOUND"&&Tt.includes("database")&&Tt.includes("does not exist")&&Tt.includes(this.databaseId.database)&&Qt(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),jt===void 0&&(jt=S.INTERNAL,Tt="Unknown error status: "+rt+" with message "+J.message),I=!0,b.en(new k(jt,Tt)),m.close()}else O(It,`RPC '${t}' stream ${s} received:`,L),b.tn(L)}})),cn.rn(),setTimeout((()=>{b.Xt()}),0),b}terminate(){this.nn.forEach((t=>t.close())),this.nn=[]}En(t){this.nn.push(t)}hn(t){this.nn=this.nn.filter((e=>e===t))}kt(t,e,r){super.kt(t,e,r),this.databaseInfo.apiKey&&(t["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return ic()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pm(n){return new cn(n)}cn.sn=!1;class Jc{constructor(t,e,r=1e3,s=1.5,o=6e4){this.Tn=t,this.timerId=e,this.Pn=r,this.Rn=s,this.In=o,this.An=0,this.Vn=null,this.dn=Date.now(),this.reset()}reset(){this.An=0}fn(){this.An=this.In}mn(t){this.cancel();const e=Math.floor(this.An+this.pn()),r=Math.max(0,Date.now()-this.dn),s=Math.max(0,e-r);s>0&&O("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.An} ms, delay with jitter: ${e} ms, last attempt: ${r} ms ago)`),this.Vn=this.Tn.enqueueAfterDelay(this.timerId,s,(()=>(this.dn=Date.now(),t()))),this.An*=this.Rn,this.An<this.Pn&&(this.An=this.Pn),this.An>this.In&&(this.An=this.In)}gn(){this.Vn!==null&&(this.Vn.skipDelay(),this.Vn=null)}cancel(){this.Vn!==null&&(this.Vn.cancel(),this.Vn=null)}pn(){return(Math.random()-.5)*this.An}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Eu="PersistentStream";class Xc{constructor(t,e,r,s,o,a,c,h){this.Tn=t,this.yn=r,this.wn=s,this.connection=o,this.authCredentialsProvider=a,this.appCheckCredentialsProvider=c,this.listener=h,this.state=0,this.bn=0,this.vn=null,this.Sn=null,this.stream=null,this.Dn=0,this.xn=new Jc(t,e)}Cn(){return this.state===1||this.state===5||this.Fn()}Fn(){return this.state===2||this.state===3}start(){this.Dn=0,this.state!==4?this.auth():this.On()}async stop(){this.Cn()&&await this.close(0)}Mn(){this.state=0,this.xn.reset()}Nn(){this.Fn()&&this.vn===null&&(this.vn=this.Tn.enqueueAfterDelay(this.yn,6e4,(()=>this.Ln())))}Bn(t){this.Un(),this.stream.send(t)}async Ln(){if(this.Fn())return this.close(0)}Un(){this.vn&&(this.vn.cancel(),this.vn=null)}kn(){this.Sn&&(this.Sn.cancel(),this.Sn=null)}async close(t,e){this.Un(),this.kn(),this.xn.cancel(),this.bn++,t!==4?this.xn.reset():e&&e.code===S.RESOURCE_EXHAUSTED?(ce(e.toString()),ce("Using maximum backoff delay to prevent overloading the backend."),this.xn.fn()):e&&e.code===S.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.qn(),this.stream.close(),this.stream=null),this.state=t,await this.listener.Ht(e)}qn(){}auth(){this.state=1;const t=this.$n(this.bn),e=this.bn;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([r,s])=>{this.bn===e&&this.Kn(r,s)}),(r=>{t((()=>{const s=new k(S.UNKNOWN,"Fetching auth token failed: "+r.message);return this.Wn(s)}))}))}Kn(t,e){const r=this.$n(this.bn);this.stream=this.Qn(t,e),this.stream.Qt((()=>{r((()=>this.listener.Qt()))})),this.stream.zt((()=>{r((()=>(this.state=2,this.Sn=this.Tn.enqueueAfterDelay(this.wn,1e4,(()=>(this.Fn()&&(this.state=3),Promise.resolve()))),this.listener.zt())))})),this.stream.Ht((s=>{r((()=>this.Wn(s)))})),this.stream.onMessage((s=>{r((()=>++this.Dn==1?this.Gn(s):this.onNext(s)))}))}On(){this.state=5,this.xn.mn((async()=>{this.state=0,this.start()}))}Wn(t){return O(Eu,`close with error: ${t}`),this.stream=null,this.close(4,t)}$n(t){return e=>{this.Tn.enqueueAndForget((()=>this.bn===t?e():(O(Eu,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())))}}}class Sm extends Xc{constructor(t,e,r,s,o,a){super(t,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",e,r,s,a),this.serializer=o}Qn(t,e){return this.connection.cn("Listen",t,e)}Gn(t){return this.onNext(t)}onNext(t){this.xn.reset();const e=lm(this.serializer,t),r=(function(o){if(!("targetChange"in o))return $.min();const a=o.targetChange;return a.targetIds&&a.targetIds.length?$.min():a.readTime?te(a.readTime):$.min()})(t);return this.listener.zn(e,r)}jn(t){const e={};e.database=Di(this.serializer),e.addTarget=(function(o,a){let c;const h=a.target;if(c=je(h)?{pipelineQuery:_m(o,h)}:Nc(h)?{documents:dm(o,h)}:{query:mm(o,h).yt},c.targetId=a.targetId,a.resumeToken.approximateByteSize()>0){c.resumeToken=qc(o,a.resumeToken);const f=bi(o,a.expectedCount);f!==null&&(c.expectedCount=f)}else if(a.snapshotVersion.compareTo($.min())>0){c.readTime=ps(o,a.snapshotVersion.toTimestamp());const f=bi(o,a.expectedCount);f!==null&&(c.expectedCount=f)}return c})(this.serializer,t);const r=gm(this.serializer,t);r&&(e.labels=r),this.Bn(e)}Hn(t){const e={};e.database=Di(this.serializer),e.removeTarget=t,this.Bn(e)}}class Cm extends Xc{constructor(t,e,r,s,o,a){super(t,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",e,r,s,a),this.serializer=o}get Jn(){return this.Dn>0}start(){this.lastStreamToken=void 0,super.start()}qn(){this.Jn&&this.Yn([])}Qn(t,e){return this.connection.cn("Write",t,e)}Gn(t){return M(!!t.streamToken,31322),this.lastStreamToken=t.streamToken,M(!t.writeResults||t.writeResults.length===0,55816),this.listener.Zn()}onNext(t){M(!!t.streamToken,12678),this.lastStreamToken=t.streamToken,this.xn.reset();const e=fm(t.writeResults,t.commitTime),r=te(t.commitTime);return this.listener.Xn(r,e)}er(){const t={};t.database=Di(this.serializer),this.Bn(t)}Yn(t){const e={streamToken:this.lastStreamToken,writes:t.map((r=>hm(this.serializer,r)))};this.Bn(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bm{}class xm extends bm{constructor(t,e,r,s){super(),this.authCredentials=t,this.appCheckCredentials=e,this.connection=r,this.serializer=s,this.tr=!1}nr(){if(this.tr)throw new k(S.FAILED_PRECONDITION,"The client has already been terminated.")}Bt(t,e,r,s){return this.nr(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([o,a])=>this.connection.Bt(t,xi(e,r),s,o,a))).catch((o=>{throw o.name==="FirebaseError"?(o.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new k(S.UNKNOWN,o.toString())}))}$t(t,e,r,s,o){return this.nr(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([a,c])=>this.connection.$t(t,xi(e,r),s,a,c,o))).catch((a=>{throw a.name==="FirebaseError"?(a.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),a):new k(S.UNKNOWN,a.toString())}))}terminate(){this.tr=!0,this.connection.terminate()}}function Dm(n,t,e,r){return new xm(n,t,e,r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nm="ComponentProvider",Tu=new Map;function km(n,t,e,r,s){return new wd(n,t,e,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,Yc(s.experimentalLongPollingOptions),s.useFetchStreams,s.isUsingEmulator,r)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vu={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Zc=41943040;class xt{static withCacheSize(t){return new xt(t,xt.DEFAULT_COLLECTION_PERCENTILE,xt.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(t,e,r){this.cacheSizeCollectionThreshold=t,this.percentileToCollect=e,this.maximumSequenceNumbersToCollect=r}}xt.DEFAULT_COLLECTION_PERCENTILE=10,xt.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,xt.DEFAULT=new xt(Zc,xt.DEFAULT_COLLECTION_PERCENTILE,xt.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),xt.DISABLED=new xt(-1,0,0);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wu="LruGarbageCollector",tl=1048576;function Iu([n,t],[e,r]){const s=H(n,e);return s===0?H(t,r):s}class Om{constructor(t){this.rr=t,this.buffer=new ct(Iu),this.ir=0}sr(){return++this.ir}_r(t){const e=[t,this.sr()];if(this.buffer.size<this.rr)this.buffer=this.buffer.add(e);else{const r=this.buffer.last();Iu(e,r)<0&&(this.buffer=this.buffer.delete(r).add(e))}}get maxValue(){return this.buffer.last()[0]}}class Lm{constructor(t,e,r){this.garbageCollector=t,this.asyncQueue=e,this.localStore=r,this.ar=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.ur(6e4)}stop(){this.ar&&(this.ar.cancel(),this.ar=null)}get started(){return this.ar!==null}ur(t){O(wu,`Garbage collection scheduled in ${t}ms`),this.ar=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",t,(async()=>{this.ar=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(e){wn(e)?O(wu,"Ignoring IndexedDB error during garbage collection: ",e):await vn(e)}await this.ur(3e5)}))}}class Mm{constructor(t,e){this.cr=t,this.params=e}calculateTargetCount(t,e){return this.cr.lr(t).next((r=>Math.floor(e/100*r)))}nthSequenceNumber(t,e){if(e===0)return C.resolve(Is.ce);const r=new Om(e);return this.cr.forEachTarget(t,(s=>r._r(s.sequenceNumber))).next((()=>this.cr.Er(t,(s=>r._r(s))))).next((()=>r.maxValue))}removeTargets(t,e,r){return this.cr.removeTargets(t,e,r)}removeOrphanedDocuments(t,e){return this.cr.removeOrphanedDocuments(t,e)}collect(t,e){return this.params.cacheSizeCollectionThreshold===-1?(O("LruGarbageCollector","Garbage collection skipped; disabled"),C.resolve(vu)):this.getCacheSize(t).next((r=>r<this.params.cacheSizeCollectionThreshold?(O("LruGarbageCollector",`Garbage collection skipped; Cache size ${r} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),vu):this.hr(t,e)))}getCacheSize(t){return this.cr.getCacheSize(t)}hr(t,e){let r,s,o,a,c,h,f;const m=Date.now();return this.calculateTargetCount(t,this.params.percentileToCollect).next((p=>(p>this.params.maximumSequenceNumbersToCollect?(O("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${p}`),s=this.params.maximumSequenceNumbersToCollect):s=p,a=Date.now(),this.nthSequenceNumber(t,s)))).next((p=>(r=p,c=Date.now(),this.removeTargets(t,r,e)))).next((p=>(o=p,h=Date.now(),this.removeOrphanedDocuments(t,r)))).next((p=>(f=Date.now(),rn()<=W.DEBUG&&O("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${a-m}ms
	Determined least recently used ${s} in `+(c-a)+`ms
	Removed ${o} targets in `+(h-c)+`ms
	Removed ${p} documents in `+(f-h)+`ms
Total Duration: ${f-m}ms`),C.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:o,documentsRemoved:p}))))}}function Um(n,t){return new Mm(n,t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const el="firestore.googleapis.com",Au=!0;class Vu{constructor(t){if(t.host===void 0){if(t.ssl!==void 0)throw new k(S.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=el,this.ssl=Au}else this.host=t.host,this.ssl=t.ssl??Au;if(this.isUsingEmulator=t.emulatorOptions!==void 0,this.credentials=t.credentials,this.ignoreUndefinedProperties=!!t.ignoreUndefinedProperties,this.localCache=t.localCache,t.cacheSizeBytes===void 0)this.cacheSizeBytes=Zc;else{if(t.cacheSizeBytes!==-1&&t.cacheSizeBytes<tl)throw new k(S.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=t.cacheSizeBytes}cd("experimentalForceLongPolling",t.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",t.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!t.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:t.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!t.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=Yc(t.experimentalLongPollingOptions??{}),(function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new k(S.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new k(S.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new k(S.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!t.useFetchStreams}isEqual(t){return this.host===t.host&&this.ssl===t.ssl&&this.credentials===t.credentials&&this.cacheSizeBytes===t.cacheSizeBytes&&this.experimentalForceLongPolling===t.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===t.experimentalAutoDetectLongPolling&&(function(r,s){return r.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,t.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===t.ignoreUndefinedProperties&&this.useFetchStreams===t.useFetchStreams}}class Ds{constructor(t,e,r,s){this._authCredentials=t,this._appCheckCredentials=e,this._databaseId=r,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Vu({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new k(S.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(t){if(this._settingsFrozen)throw new k(S.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Vu(t),this._emulatorOptions=t.emulatorOptions||{},t.credentials!==void 0&&(this._authCredentials=(function(r){if(!r)return new Zf;switch(r.type){case"firstParty":return new rd(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new k(S.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(t.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(e){const r=Tu.get(e);r&&(O(Nm,"Removing Datastore"),Tu.delete(e),r.terminate())})(this),Promise.resolve()}}function Fm(n,t,e,r={}){var f;n=oe(n,Ds);const s=ji(t),o=n._getSettings(),a={...o,emulatorOptions:n._getEmulatorOptions()},c=`${t}:${e}`;s&&Wu(`https://${c}`),o.host!==el&&o.host!==c&&Qt("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const h={...o,host:c,ssl:s,emulatorOptions:r};if(!nr(h,a)&&(n._setSettings(h),r.mockUserToken)){let m,p;if(typeof r.mockUserToken=="string")m=r.mockUserToken,p=At.MOCK_USER;else{m=Fh(r.mockUserToken,(f=n._app)==null?void 0:f.options.projectId);const I=r.mockUserToken.sub||r.mockUserToken.user_id;if(!I)throw new k(S.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");p=new At(I)}n._authCredentials=new td(new ac(m,p))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Je{constructor(t,e,r){this.converter=e,this._query=r,this.type="query",this.firestore=t}withConverter(t){return new Je(this.firestore,t,this._query)}}class it{constructor(t,e,r){this.converter=e,this._key=r,this.type="document",this.firestore=t}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Te(this.firestore,this.converter,this._key.path.popLast())}withConverter(t){return new it(this.firestore,t,this._key)}toJSON(){return{type:it._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(t,e,r){if(Ar(e,it._jsonSchema))return new it(t,r||null,new F(Y.fromString(e.referencePath)))}}it._jsonSchemaVersion="firestore/documentReference/1.0",it._jsonSchema={type:ut("string",it._jsonSchemaVersion),referencePath:ut("string")};class Te extends Je{constructor(t,e,r){super(t,e,Ji(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const t=this._path.popLast();return t.isEmpty()?null:new it(this.firestore,null,new F(t))}withConverter(t){return new Te(this.firestore,t,this._path)}}function ey(n,t,...e){if(n=ne(n),uc("collection","path",t),n instanceof Ds){const r=Y.fromString(t,...e);return Ya(r),new Te(n,null,r)}{if(!(n instanceof it||n instanceof Te))throw new k(S.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(Y.fromString(t,...e));return Ya(r),new Te(n.firestore,null,r)}}function ny(n,t,...e){if(n=ne(n),arguments.length===1&&(t=Gi.newId()),uc("doc","path",t),n instanceof Ds){const r=Y.fromString(t,...e);return Wa(r),new it(n,null,new F(r))}{if(!(n instanceof it||n instanceof Te))throw new k(S.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(Y.fromString(t,...e));return Wa(r),new it(n.firestore,n instanceof Te?n.converter:null,new F(r))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kt{constructor(t){this._values=(t||[]).map((e=>e))}toArray(){return this._values.map((t=>t))}isEqual(t){return(function(r,s){if(r.length!==s.length)return!1;for(let o=0;o<r.length;++o)if(r[o]!==s[o])return!1;return!0})(this._values,t._values)}toJSON(){return{type:kt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(t){if(Ar(t,kt._jsonSchema)){if(Array.isArray(t.vectorValues)&&t.vectorValues.every((e=>typeof e=="number")))return new kt(t.vectorValues);throw new k(S.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}kt._jsonSchemaVersion="firestore/vectorValue/1.0",kt._jsonSchema={type:ut("string",kt._jsonSchemaVersion),vectorValues:ut("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bm=/^__.*__$/;class qm{constructor(t,e,r){this.data=t,this.fieldMask=e,this.fieldTransforms=r}toMutation(t,e){return this.fieldMask!==null?new Oe(t,this.data,this.fieldMask,e,this.fieldTransforms):new Rr(t,this.data,e,this.fieldTransforms)}}class nl{constructor(t,e,r){this.data=t,this.fieldMask=e,this.fieldTransforms=r}toMutation(t,e){return new Oe(t,this.data,this.fieldMask,e,this.fieldTransforms)}}function rl(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw B(40011,{dataSource:n})}}class ro{constructor(t,e,r,s,o,a){this.settings=t,this.databaseId=e,this.serializer=r,this.ignoreUndefinedProperties=s,o===void 0&&this.validatePath(),this.fieldTransforms=o||[],this.fieldMask=a||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}contextWith(t){return new ro({...this.settings,...t},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}childContextForField(t){var s;const e=(s=this.path)==null?void 0:s.child(t),r=this.contextWith({path:e,arrayElement:!1});return r.validatePathSegment(t),r}childContextForFieldPath(t){var s;const e=(s=this.path)==null?void 0:s.child(t),r=this.contextWith({path:e,arrayElement:!1});return r.validatePath(),r}childContextForArray(t){return this.contextWith({path:void 0,arrayElement:!0})}createError(t){return _s(t,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(t){return this.fieldMask.find((e=>t.isPrefixOf(e)))!==void 0||this.fieldTransforms.find((e=>t.isPrefixOf(e.field)))!==void 0}validatePath(){if(this.path)for(let t=0;t<this.path.length;t++)this.validatePathSegment(this.path.get(t))}validatePathSegment(t){if(t.length===0)throw this.createError("Document fields must not be empty");if(rl(this.dataSource)&&Bm.test(t))throw this.createError('Document fields cannot begin and end with "__"')}}class $m{constructor(t,e,r){this.databaseId=t,this.ignoreUndefinedProperties=e,this.serializer=r||bs(t)}createContext(t,e,r,s=!1){return new ro({dataSource:t,methodName:e,targetDoc:r,path:dt.emptyPath(),arrayElement:!1,hasConverter:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function so(n){const t=n._freezeSettings(),e=bs(n._databaseId);return new $m(n._databaseId,!!t.ignoreUndefinedProperties,e)}function jm(n,t,e,r,s,o={}){const a=n.createContext(o.merge||o.mergeFields?2:0,t,e,s);io("Data must be an object, but it was:",a,r);const c=sl(r,a);let h,f;if(o.merge)h=new Bt(a.fieldMask),f=a.fieldTransforms;else if(o.mergeFields){const m=[];for(const p of o.mergeFields){const I=We(t,p,e);if(!a.contains(I))throw new k(S.INVALID_ARGUMENT,`Field '${I}' is specified in your field mask but missing from your input data.`);al(m,I)||m.push(I)}h=new Bt(m),f=a.fieldTransforms.filter((p=>h.covers(p.field)))}else h=null,f=a.fieldTransforms;return new qm(new Ct(c),h,f)}class Ns extends no{_toFieldTransform(t){if(t.dataSource!==2)throw t.dataSource===1?t.createError(`${this._methodName}() can only appear at the top level of your update data`):t.createError(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return t.fieldMask.push(t.path),null}isEqual(t){return t instanceof Ns}}function zm(n,t,e,r){const s=n.createContext(1,t,e);io("Data must be an object, but it was:",s,r);const o=[],a=Ct.empty();ke(r,((h,f)=>{const m=ol(t,h,e);f=ne(f);const p=s.childContextForFieldPath(m);if(f instanceof Ns)o.push(m);else{const I=Se(f,p);I!=null&&(o.push(m),a.set(m,I))}}));const c=new Bt(o);return new nl(a,c,s.fieldTransforms)}function Gm(n,t,e,r,s,o){const a=n.createContext(1,t,e),c=[We(t,r,e)],h=[s];if(o.length%2!=0)throw new k(S.INVALID_ARGUMENT,`Function ${t}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let I=0;I<o.length;I+=2)c.push(We(t,o[I])),h.push(o[I+1]);const f=[],m=Ct.empty();for(let I=c.length-1;I>=0;--I)if(!al(f,c[I])){const b=c[I];let x=h[I];x=ne(x);const U=a.childContextForFieldPath(b);if(x instanceof Ns)f.push(b);else{const L=Se(x,U);L!=null&&(f.push(b),m.set(b,L))}}const p=new Bt(f);return new nl(m,p,a.fieldTransforms)}function Hm(n,t,e,r=!1){return Se(e,n.createContext(r?4:3,t))}function Se(n,t,e){if(il(n=ne(n)))return io("Unsupported field value:",t,n),sl(n,t);if(n instanceof no)return(function(s,o){if(!rl(o.dataSource))throw o.createError(`${s._methodName}() can only be used with update() and set()`);if(!o.path)throw o.createError(`${s._methodName}() is not currently supported inside arrays`);const a=s._toFieldTransform(o);a&&o.fieldTransforms.push(a)})(n,t),null;if(n===void 0&&t.ignoreUndefinedProperties)return null;if(t.path&&t.fieldMask.push(t.path),n instanceof Array){if(t.settings.arrayElement&&t.dataSource!==4)throw t.createError("Nested arrays are not supported");return(function(s,o){const a=[];let c=0;for(const h of s){let f=Se(h,o.childContextForArray(c));f==null&&(f={nullValue:"NULL_VALUE"}),a.push(f),c++}return{arrayValue:{values:a}}})(n,t)}return(function(s,o,a){if((s=ne(s))===null)return{nullValue:"NULL_VALUE"};if(typeof s=="number")return Ki(o.serializer,s,a);if(typeof s=="boolean")return{booleanValue:s};if(typeof s=="string")return{stringValue:s};if(s instanceof Date){const c=tt.fromDate(s);return{timestampValue:ps(o.serializer,c)}}if(s instanceof tt){const c=new tt(s.seconds,1e3*Math.floor(s.nanoseconds/1e3));return{timestampValue:ps(o.serializer,c)}}if(s instanceof ee)return{geoPointValue:{latitude:s.latitude,longitude:s.longitude}};if(s instanceof zt)return{bytesValue:qc(o.serializer,s._byteString)};if(s instanceof it){const c=o.databaseId,h=s.firestore._databaseId;if(!h.isEqual(c))throw o.createError(`Document reference is for database ${h.projectId}/${h.database} but should be for database ${c.projectId}/${c.database}`);return{referenceValue:eo(s.firestore._databaseId||o.databaseId,s._key.path)}}if(s instanceof kt)return(function(h,f){const m=h instanceof kt?h.toArray():h;return{mapValue:{fields:{[gc]:{stringValue:_c},[lr]:{arrayValue:{values:m.map((I=>{if(typeof I!="number")throw f.createError("VectorValues must only contain numeric values.");return Rs(f.serializer,I)}))}}}}}})(s,o);if(Kc(s))return s._toProto(o.serializer);throw o.createError(`Unsupported field value: ${ws(s)}`)})(n,t,e)}function sl(n,t){const e={};return lc(n)?t.path&&t.path.length>0&&t.fieldMask.push(t.path):ke(n,((r,s)=>{const o=Se(s,t.childContextForField(r));o!=null&&(e[r]=o)})),{mapValue:{fields:e}}}function il(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof tt||n instanceof ee||n instanceof zt||n instanceof it||n instanceof no||n instanceof kt||Kc(n))}function io(n,t,e){if(!il(e)||!Ir(e)){const r=ws(e);throw r==="an object"?t.createError(n+" a custom object"):t.createError(n+" "+r)}}function We(n,t,e){if((t=ne(t))instanceof xs)return t._internalPath;if(typeof t=="string")return ol(n,t);throw _s("Field path arguments must be of type string or ",n,!1,void 0,e)}const Qm=new RegExp("[~\\*/\\[\\]]");function ol(n,t,e){if(t.search(Qm)>=0)throw _s(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,e);try{return new xs(...t.split("."))._internalPath}catch{throw _s(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,e)}}function _s(n,t,e,r,s){const o=r&&!r.isEmpty(),a=s!==void 0;let c=`Function ${t}() called with invalid data`;e&&(c+=" (via `toFirestore()`)"),c+=". ";let h="";return(o||a)&&(h+=" (found",o&&(h+=` in field ${r}`),a&&(h+=` in document ${s}`),h+=")"),new k(S.INVALID_ARGUMENT,c+n+h)}function al(n,t){return n.some((e=>e.isEqual(t)))}function Km(n){return typeof n._readUserData=="function"}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rt{constructor(t){this.optionDefinitions=t}_getKnownOptions(t,e){const r=Ct.empty();for(const s in this.optionDefinitions)if(this.optionDefinitions.hasOwnProperty(s)){const o=this.optionDefinitions[s];if(s in t){const a=t[s];let c;o.nestedOptions&&Ir(a)?c={mapValue:{fields:new Rt(o.nestedOptions).getOptionsProto(e,a)}}:a&&(c=Se(a,e)??void 0),c&&r.set(dt.fromServerFormat(o.serverName),c)}}return r}getOptionsProto(t,e,r){const s=this._getKnownOptions(e,t);if(r){const o=new Map(Td(r,((a,c)=>[dt.fromServerFormat(c),a!==void 0?Se(a,t):null])));s.setAll(o)}return s.value.mapValue.fields??{}}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wm(n){return typeof n=="object"&&n!==null&&!!("nullValue"in n&&(n.nullValue===null||n.nullValue==="NULL_VALUE")||"booleanValue"in n&&(n.booleanValue===null||typeof n.booleanValue=="boolean")||"integerValue"in n&&(n.integerValue===null||typeof n.integerValue=="number"||typeof n.integerValue=="string")||"doubleValue"in n&&(n.doubleValue===null||typeof n.doubleValue=="number")||"timestampValue"in n&&(n.timestampValue===null||(function(e){return typeof e=="object"&&e!==null&&"seconds"in e&&(e.seconds===null||typeof e.seconds=="number"||typeof e.seconds=="string")&&"nanos"in e&&(e.nanos===null||typeof e.nanos=="number")})(n.timestampValue))||"stringValue"in n&&(n.stringValue===null||typeof n.stringValue=="string")||"bytesValue"in n&&(n.bytesValue===null||n.bytesValue instanceof Uint8Array)||"referenceValue"in n&&(n.referenceValue===null||typeof n.referenceValue=="string")||"geoPointValue"in n&&(n.geoPointValue===null||(function(e){return typeof e=="object"&&e!==null&&"latitude"in e&&(e.latitude===null||typeof e.latitude=="number")&&"longitude"in e&&(e.longitude===null||typeof e.longitude=="number")})(n.geoPointValue))||"arrayValue"in n&&(n.arrayValue===null||(function(e){return typeof e=="object"&&e!==null&&!(!("values"in e)||e.values!==null&&!Array.isArray(e.values))})(n.arrayValue))||"mapValue"in n&&(n.mapValue===null||(function(e){return typeof e=="object"&&e!==null&&!(!("fields"in e)||e.fields!==null&&!Ir(e.fields))})(n.mapValue))||"fieldReferenceValue"in n&&(n.fieldReferenceValue===null||typeof n.fieldReferenceValue=="string")||"functionValue"in n&&(n.functionValue===null||(function(e){return typeof e=="object"&&e!==null&&!(!("name"in e)||e.name!==null&&typeof e.name!="string"||!("args"in e)||e.args!==null&&!Array.isArray(e.args))})(n.functionValue))||"pipelineValue"in n&&(n.pipelineValue===null||(function(e){return typeof e=="object"&&e!==null&&!(!("stages"in e)||e.stages!==null&&!Array.isArray(e.stages))})(n.pipelineValue)))}function Ym(n){return new kt(n)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function D(n){let t;return n instanceof Xe?n:(t=Ir(n)?np(n):n instanceof Array?rp(n):ul(n,void 0),t)}function gi(n){if(n instanceof Xe)return n;if(n instanceof kt)return _r(n);if(Array.isArray(n))return _r(Ym(n));throw new Error("Unsupported value: "+typeof n)}function oo(n){return _d(n)?Zm(n):D(n)}class Xe{constructor(){this._protoValueType="ProtoValue"}add(t){return new P("add",[this,D(t)],"add")}asBoolean(){if(this instanceof Ce)return this;if(this instanceof An)return new ll(this);if(this instanceof Cr)return new ep(this);if(this instanceof P)return new cl(this);throw new k("invalid-argument",`Conversion of type ${typeof this} to BooleanExpression not supported.`)}subtract(t){return new P("subtract",[this,D(t)],"subtract")}multiply(t){return new P("multiply",[this,D(t)],"multiply")}divide(t){return new P("divide",[this,D(t)],"divide")}mod(t){return new P("mod",[this,D(t)],"mod")}equal(t){return new P("equal",[this,D(t)],"equal").asBoolean()}notEqual(t){return new P("not_equal",[this,D(t)],"notEqual").asBoolean()}lessThan(t){return new P("less_than",[this,D(t)],"lessThan").asBoolean()}lessThanOrEqual(t){return new P("less_than_or_equal",[this,D(t)],"lessThanOrEqual").asBoolean()}greaterThan(t){return new P("greater_than",[this,D(t)],"greaterThan").asBoolean()}greaterThanOrEqual(t){return new P("greater_than_or_equal",[this,D(t)],"greaterThanOrEqual").asBoolean()}arrayConcat(t,...e){const r=[t,...e].map((s=>D(s)));return new P("array_concat",[this,...r],"arrayConcat")}arrayContains(t){return new P("array_contains",[this,D(t)],"arrayContains").asBoolean()}arrayContainsAll(t){const e=Array.isArray(t)?new Kn(t.map(D),"arrayContainsAll"):t;return new P("array_contains_all",[this,e],"arrayContainsAll").asBoolean()}arrayContainsAny(t){const e=Array.isArray(t)?new Kn(t.map(D),"arrayContainsAny"):t;return new P("array_contains_any",[this,e],"arrayContainsAny").asBoolean()}arrayReverse(){return new P("array_reverse",[this])}arrayLength(){return new P("array_length",[this],"arrayLength")}equalAny(t){const e=Array.isArray(t)?new Kn(t.map(D),"equalAny"):t;return new P("equal_any",[this,e],"equalAny").asBoolean()}notEqualAny(t){const e=Array.isArray(t)?new Kn(t.map(D),"notEqualAny"):t;return new P("not_equal_any",[this,e],"notEqualAny").asBoolean()}exists(){return new P("exists",[this],"exists").asBoolean()}charLength(){return new P("char_length",[this],"charLength")}like(t){return new P("like",[this,D(t)],"like").asBoolean()}regexContains(t){return new P("regex_contains",[this,D(t)],"regexContains").asBoolean()}regexFind(t){return new P("regex_find",[this,D(t)],"regexFind")}regexFindAll(t){return new P("regex_find_all",[this,D(t)],"regexFindAll")}regexMatch(t){return new P("regex_match",[this,D(t)],"regexMatch").asBoolean()}stringContains(t){return new P("string_contains",[this,D(t)],"stringContains").asBoolean()}startsWith(t){return new P("starts_with",[this,D(t)],"startsWith").asBoolean()}endsWith(t){return new P("ends_with",[this,D(t)],"endsWith").asBoolean()}toLower(){return new P("to_lower",[this],"toLower")}toUpper(){return new P("to_upper",[this],"toUpper")}trim(t){const e=[this];return t&&e.push(D(t)),new P("trim",e,"trim")}ltrim(t){const e=[this];return t&&e.push(D(t)),new P("ltrim",e,"ltrim")}rtrim(t){const e=[this];return t&&e.push(D(t)),new P("rtrim",e,"rtrim")}type(){return new P("type",[this])}isType(t){return new P("is_type",[this,_r(t)],"isType").asBoolean()}stringConcat(t,...e){const r=[t,...e].map(D);return new P("string_concat",[this,...r],"stringConcat")}stringIndexOf(t){return new P("string_index_of",[this,D(t)],"stringIndexOf")}stringRepeat(t){return new P("string_repeat",[this,D(t)],"stringRepeat")}stringReplaceAll(t,e){return new P("string_replace_all",[this,D(t),D(e)],"stringReplaceAll")}stringReplaceOne(t,e){return new P("string_replace_one",[this,D(t),D(e)],"stringReplaceOne")}concat(t,...e){const r=[t,...e].map(D);return new P("concat",[this,...r],"concat")}reverse(){return new P("reverse",[this],"reverse")}arrayFilter(t,e){return new P("array_filter",[this,D(t),e],"arrayFilter")}arrayTransform(t,e){return new P("array_transform",[this,D(t),e],"arrayTransform")}arrayTransformWithIndex(t,e,r){return new P("array_transform",[this,D(t),D(e),r],"arrayTransformWithIndex")}arraySlice(t,e){const r=[this,D(t)];return e!==void 0&&r.push(D(e)),new P("array_slice",r,"arraySlice")}arrayFirst(){return new P("array_first",[this],"arrayFirst")}arrayFirstN(t){return new P("array_first_n",[this,D(t)],"arrayFirstN")}arrayLast(){return new P("array_last",[this],"arrayLast")}arrayLastN(t){return new P("array_last_n",[this,D(t)],"arrayLastN")}arrayMaximum(){return new P("maximum",[this],"arrayMaximum")}arrayMaximumN(t){return new P("maximum_n",[this,D(t)],"arrayMaximumN")}arrayMinimum(){return new P("minimum",[this],"arrayMinimum")}arrayMinimumN(t){return new P("minimum_n",[this,D(t)],"arrayMinimumN")}arrayIndexOf(t){return new P("array_index_of",[this,D(t),D("first")],"arrayIndexOf")}arrayLastIndexOf(t){return new P("array_index_of",[this,D(t),D("last")],"arrayLastIndexOf")}arrayIndexOfAll(t){return new P("array_index_of_all",[this,D(t)],"arrayIndexOfAll")}byteLength(){return new P("byte_length",[this],"byteLength")}ceil(){return new P("ceil",[this])}floor(){return new P("floor",[this])}abs(){return new P("abs",[this])}exp(){return new P("exp",[this])}mapGet(t){return new P("map_get",[this,_r(t)],"mapGet")}mapSet(t,e,...r){const s=[this,D(t),D(e),...r.map(D)];return new P("map_set",s,"mapSet")}mapKeys(){return new P("map_keys",[this],"mapKeys")}mapValues(){return new P("map_values",[this],"mapValues")}mapEntries(){return new P("map_entries",[this],"mapEntries")}getField(t){return new P("get_field",[this,D(t)],"get_field")}count(){return Ft._create("count",[this],"count")}sum(){return Ft._create("sum",[this],"sum")}average(){return Ft._create("average",[this],"average")}minimum(){return Ft._create("minimum",[this],"minimum")}maximum(){return Ft._create("maximum",[this],"maximum")}first(){return Ft._create("first",[this],"first")}last(){return Ft._create("last",[this],"last")}arrayAgg(){return Ft._create("array_agg",[this],"arrayAgg")}arrayAggDistinct(){return Ft._create("array_agg_distinct",[this],"arrayAggDistinct")}countDistinct(){return Ft._create("count_distinct",[this],"countDistinct")}logicalMaximum(t,...e){const r=[t,...e];return new P("maximum",[this,...r.map(D)],"logicalMaximum")}logicalMinimum(t,...e){const r=[t,...e];return new P("minimum",[this,...r.map(D)],"minimum")}vectorLength(){return new P("vector_length",[this],"vectorLength")}cosineDistance(t){return new P("cosine_distance",[this,gi(t)],"cosineDistance")}dotProduct(t){return new P("dot_product",[this,gi(t)],"dotProduct")}euclideanDistance(t){return new P("euclidean_distance",[this,gi(t)],"euclideanDistance")}unixMicrosToTimestamp(){return new P("unix_micros_to_timestamp",[this],"unixMicrosToTimestamp")}timestampToUnixMicros(){return new P("timestamp_to_unix_micros",[this],"timestampToUnixMicros")}unixMillisToTimestamp(){return new P("unix_millis_to_timestamp",[this],"unixMillisToTimestamp")}timestampToUnixMillis(){return new P("timestamp_to_unix_millis",[this],"timestampToUnixMillis")}unixSecondsToTimestamp(){return new P("unix_seconds_to_timestamp",[this],"unixSecondsToTimestamp")}timestampToUnixSeconds(){return new P("timestamp_to_unix_seconds",[this],"timestampToUnixSeconds")}timestampAdd(t,e){return new P("timestamp_add",[this,D(t),D(e)],"timestampAdd")}timestampSubtract(t,e){return new P("timestamp_subtract",[this,D(t),D(e)],"timestampSubtract")}timestampDiff(t,e){return new P("timestamp_diff",[this,oo(t),D(e)],"timestampDiff")}timestampExtract(t,e){const r=[this,D(t)];return e&&r.push(D(e)),new P("timestamp_extract",r,"timestampExtract")}documentId(){return new P("document_id",[this],"documentId")}parent(){return new P("parent",[this],"parent")}substring(t,e){const r=D(t);return new P("substring",e===void 0?[this,r]:[this,r,D(e)],"substring")}arrayGet(t){return new P("array_get",[this,D(t)],"arrayGet")}isError(){return new P("is_error",[this],"isError").asBoolean()}ifError(t){const e=new P("if_error",[this,D(t)],"ifError");return t instanceof Ce?e.asBoolean():e}isAbsent(){return new P("is_absent",[this],"isAbsent").asBoolean()}mapRemove(t){return new P("map_remove",[this,D(t)],"mapRemove")}mapMerge(t,...e){const r=D(t),s=e.map(D);return new P("map_merge",[this,r,...s],"mapMerge")}pow(t){return new P("pow",[this,D(t)])}trunc(t){return t===void 0?new P("trunc",[this]):new P("trunc",[this,D(t)],"trunc")}round(t){return t===void 0?new P("round",[this]):new P("round",[this,D(t)],"round")}collectionId(){return new P("collection_id",[this])}length(){return new P("length",[this])}ln(){return new P("ln",[this])}sqrt(){return new P("sqrt",[this])}stringReverse(){return new P("string_reverse",[this])}ifAbsent(t){return new P("if_absent",[this,D(t)],"ifAbsent")}ifNull(t){return new P("if_null",[this,D(t)],"ifNull")}coalesce(t,...e){return new P("coalesce",[this,D(t),...e.map(D)],"coalesce")}join(t){return new P("join",[this,D(t)],"join")}log10(){return new P("log10",[this])}arraySum(){return new P("sum",[this])}split(t){return new P("split",[this,D(t)])}timestampTruncate(t,e){const r=[this,D(t)];return e&&r.push(D(e)),new P("timestamp_trunc",r)}ascending(){return sp(this)}descending(){return ip(this)}as(t){return new Xm(this,t,"as")}}class Ft{constructor(t,e){this.name=t,this.params=e,this.exprType="AggregateFunction",this._protoValueType="ProtoValue"}static _create(t,e,r){const s=new Ft(t,e);return s._methodName=r,s}as(t){return new Jm(this,t,"as")}_toProto(t){return{functionValue:{name:this.name,args:this.params.map((e=>e._toProto(t)))}}}_readUserData(t){t=this._methodName?t.contextWith({methodName:this._methodName}):t,this.params.forEach((e=>e._readUserData(t)))}}class Jm{constructor(t,e,r){this.aggregate=t,this.alias=e,this._methodName=r}_readUserData(t){this.aggregate._readUserData(t)}}class Xm{constructor(t,e,r){this.expr=t,this.alias=e,this._methodName=r,this.exprType="AliasedExpression",this.selectable=!0}_readUserData(t){this.expr._readUserData(t)}}class Kn extends Xe{constructor(t,e){super(),this.Rr=t,this._methodName=e,this.expressionType="ListOfExpressions"}_toProto(t){return{arrayValue:{values:this.Rr.map((e=>e._toProto(t)))}}}_readUserData(t){this.Rr.forEach((e=>e._readUserData(t)))}}class Cr extends Xe{constructor(t,e){super(),this.fieldPath=t,this._methodName=e,this.expressionType="Field",this.selectable=!0}get _fieldPath(){return this.fieldPath}get fieldName(){return this.fieldPath.canonicalString()}get alias(){return this.fieldName}get expr(){return this}geoDistance(t){return new P("geo_distance",[this,D(t)],"geoDistance")}_toProto(t){return{fieldReferenceValue:this.fieldPath.canonicalString()}}_readUserData(t){}}function Zm(n){return tp(n,"field")}function tp(n,t){return new Cr(typeof n=="string"?fn===n?wm()._internalPath:We("field",n):n._internalPath,t)}class An extends Xe{constructor(t,e){super(),this.value=t,this._methodName=e,this.expressionType="Constant"}static _fromProto(t){const e=new An(t,void 0);return e._protoValue=t,e}_toProto(t){return M(this._protoValue!==void 0,237),this._protoValue}_getValue(){return this._protoValue}_readUserData(t){t=this._methodName?t.contextWith({methodName:this._methodName}):t,Wm(this._protoValue)||(this._protoValue=Se(this.value,t))}}function _r(n,t){return ul(n,"constant")}function ul(n,t){const e=new An(n,t);return typeof n=="boolean"?new ll(e):e}class P extends Xe{constructor(t,e,r,s){super(),this.name=t,this.params=e,this.expressionType="Function",this._optionsProto=void 0,r!==void 0&&(this._methodName=r),s!==void 0&&(this._options=s)}get _optionsUtil(){return new Rt({})}_toProto(t){const e={functionValue:{name:this.name,args:this.params.map((r=>r._toProto(t)))}};return this._optionsProto&&(e.functionValue.options=this._optionsProto),e}_readUserData(t){t=this._methodName?t.contextWith({methodName:this._methodName}):t,this.params.forEach((e=>e._readUserData(t))),this._options&&(this._optionsProto=this._optionsUtil.getOptionsProto(t,this._options))}}class Ce extends Xe{get _methodName(){return this._expr._methodName}countIf(){return Ft._create("count_if",[this],"countIf")}not(){return new P("not",[this],"not").asBoolean()}conditional(t,e){return new P("conditional",[this,t,e],"conditional")}ifError(t){const e=D(t),r=new P("if_error",[this,e],"ifError");return e instanceof Ce?r.asBoolean():r}_toProto(t){return this._expr._toProto(t)}_readUserData(t){this._expr._readUserData(t)}}class cl extends Ce{constructor(t){super(),this._expr=t,this.expressionType="Function"}}class ll extends Ce{constructor(t){super(),this._expr=t,this.expressionType="Constant"}_getValue(){return this._expr._getValue()}}class ep extends Ce{constructor(t){super(),this._expr=t,this.expressionType="Field"}}function np(n,t){const e=[];for(const r in n)if(Object.prototype.hasOwnProperty.call(n,r)){const s=n[r];e.push(_r(r)),e.push(D(s))}return new P("map",e,"map")}function rp(n){return(function(e,r){return new P("array",e.map((s=>D(s))),r)})(n,"array")}function sp(n){return new hl(oo(n),"ascending","ascending")}function ip(n){return new hl(oo(n),"descending","descending")}class hl{constructor(t,e,r){this.expr=t,this.direction=e,this._methodName=r,this._protoValueType="ProtoValue"}_toProto(t){return{mapValue:{fields:{direction:Wc(this.direction),expression:this.expr._toProto(t)}}}}_readUserData(t){this.expr._readUserData(t)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $t{constructor(t){this.optionsProto=void 0,{rawOptions:this.rawOptions,...this.knownOptions}=t}_readUserData(t){this.optionsProto=this._optionsUtil.getOptionsProto(t,this.knownOptions,this.rawOptions)}_toProto(t){return{name:this._name,options:this.optionsProto}}}class fl extends $t{get _name(){return"add_fields"}get _optionsUtil(){return new Rt({})}constructor(t,e){super(e),this.fields=t}_toProto(t){return{...super._toProto(t),args:[gr(t,this.fields)]}}_readUserData(t){super._readUserData(t),be(this.fields,t)}}class dl extends $t{get _name(){return"aggregate"}get _optionsUtil(){return new Rt({})}constructor(t,e,r){super(r),this.groups=t,this.accumulators=e}_toProto(t){return{...super._toProto(t),args:[gr(t,this.accumulators),gr(t,this.groups)]}}_readUserData(t){super._readUserData(t),be(this.groups,t),be(this.accumulators,t)}}class ml extends $t{get _name(){return"distinct"}get _optionsUtil(){return new Rt({})}constructor(t,e){super(e),this.groups=t}_toProto(t){return{...super._toProto(t),args:[gr(t,this.groups)]}}_readUserData(t){super._readUserData(t),be(this.groups,t)}}class ks extends $t{get _name(){return"collection"}get _optionsUtil(){return new Rt({forceIndex:{serverName:"force_index"}})}constructor(t,e){super(e),this.Vr=t.startsWith("/")?t:"/"+t}_toProto(t){return{...super._toProto(t),args:[{referenceValue:this.Vr}]}}_readUserData(t){super._readUserData(t)}}class Os extends $t{get _name(){return"collection_group"}get _optionsUtil(){return new Rt({forceIndex:{serverName:"force_index"}})}constructor(t,e){super(e),this.collectionId=t}_toProto(t){return{...super._toProto(t),args:[{referenceValue:""},{stringValue:this.collectionId}]}}_readUserData(t){super._readUserData(t)}}class ao extends $t{get _name(){return"database"}get _optionsUtil(){return new Rt({})}_toProto(t){return{...super._toProto(t)}}_readUserData(t){super._readUserData(t)}}class uo extends $t{get _name(){return"documents"}get _optionsUtil(){return new Rt({})}constructor(t,e){if(super(e),!t||t.length===0)throw new k(S.INVALID_ARGUMENT,"Empty document paths are not allowed in DocumentsSource");const r=t.map((o=>o.startsWith("/")?o:"/"+o)),s=new Set(r);if(s.size!==r.length)throw new k(S.INVALID_ARGUMENT,"Duplicate document paths are not allowed in DocumentsSource");this.dr=r,this.mr=s}_toProto(t){return{...super._toProto(t),args:this.dr.map((e=>({referenceValue:e})))}}_readUserData(t){super._readUserData(t)}}class co extends $t{get _name(){return"where"}get _optionsUtil(){return new Rt({})}constructor(t,e){super(e),this.condition=t}_toProto(t){return{...super._toProto(t),args:[this.condition._toProto(t)]}}_readUserData(t){super._readUserData(t),be(this.condition,t)}}class yr extends $t{get _name(){return"limit"}get _optionsUtil(){return new Rt({})}constructor(t,e){M(!isNaN(t)&&t!==1/0&&t!==-1/0,34860),super(e),this.limit=t}_toProto(t){return{...super._toProto(t),args:[Ki(t,this.limit)]}}}class Ru extends $t{get _name(){return"offset"}get _optionsUtil(){return new Rt({})}constructor(t,e){super(e),this.offset=t}_toProto(t){return{...super._toProto(t),args:[Ki(t,this.offset)]}}}class op extends $t{get _name(){return"select"}get _optionsUtil(){return new Rt({})}constructor(t,e){super(e),this.selections=t}_toProto(t){return{...super._toProto(t),args:[gr(t,this.selections)]}}_readUserData(t){super._readUserData(t),be(this.selections,t)}}class lo extends $t{get _name(){return"sort"}get _optionsUtil(){return new Rt({})}constructor(t,e){super(e),this.orderings=t}_toProto(t){return{...super._toProto(t),args:this.orderings.map((e=>e._toProto(t)))}}_readUserData(t){super._readUserData(t),be(this.orderings,t)}}class ho extends $t{get _name(){return"replace_with"}get _optionsUtil(){return new Rt({})}constructor(t,e){super(e),this.map=t}_toProto(t){return{...super._toProto(t),args:[this.map._toProto(t),Wc(ho.pr)]}}_readUserData(t){super._readUserData(t),be(this.map,t)}}ho.pr="full_replace";function be(n,t){return Km(n)?n._readUserData(t):Array.isArray(n)?n.forEach((e=>e._readUserData(t))):n instanceof Map?n.forEach((e=>e._readUserData(t))):Object.values(n).forEach((e=>e._readUserData(t))),n}// Copyright 2024 Google LLC* @license
class Dt{constructor(t,e,r){this.serializer=t,this.stages=e,this.listenOptions=r,this.isCorePipeline=!0}getPipelineCollection(){return Ls(this)}getPipelineCollectionGroup(){return fo(this)}getPipelineCollectionId(){return ap(this)}getPipelineDocuments(){return ki(this)}getPipelineFlavor(){return(function(e){let r="exact";return e.stages.forEach(((s,o)=>{s._name!==ml.name&&s._name!==dl.name||(r="keyless"),s._name===op.name&&r==="exact"&&(r="augmented"),s._name===fl.name&&o<e.stages.length-1&&r==="exact"&&(r="augmented")})),r})(this)}getPipelineSourceType(){return ve(this)}}function ve(n){const t=n.stages[0];return t instanceof ks||t instanceof Os||t instanceof ao||t instanceof uo?t._name:"unknown"}function Ls(n){if(ve(n)==="collection")return n.stages[0].Vr}function fo(n){if(ve(n)==="collection_group")return n.stages[0].collectionId}function ap(n){switch(ve(n)){case"collection":return Y.fromString(Ls(n)).lastSegment();case"collection_group":return fo(n);default:return}}function ki(n){if(ve(n)==="documents")return n.stages[0].dr}// Copyright 2024 Google LLC* @license
class E{constructor(t,e){this.type=t,this.value=e}static vr(){return new E("ERROR",void 0)}static Sr(){return new E("UNSET",void 0)}static Dr(){return new E("NULL",mn)}static newValue(t){return qt(t)?new E("NULL",mn):(function(r){return!!r&&"booleanValue"in r})(t)?new E("BOOLEAN",t):Xt(t)?new E("INT",t):ze(t)?new E("DOUBLE",t):(function(r){return!!r&&"timestampValue"in r&&!!r.timestampValue})(t)?new E("TIMESTAMP",t):(function(r){return!!r&&"stringValue"in r})(t)?new E("STRING",t):(function(r){return!!r&&"bytesValue"in r})(t)?new E("BYTES",t):t.referenceValue?new E("REFERENCE",t):t.geoPointValue?new E("GEO_POINT",t):gn(t)?new E("ARRAY",t):cs(t)?new E("VECTOR",t):He(t)?new E("MAP",t):new E("ERROR",void 0)}Cr(){return this.type==="ERROR"||this.type==="UNSET"}Fr(){return this.type==="NULL"}}function er(n){if(!n.Cr())return n.value}function pl(n){return n instanceof Ce?n._expr:n}function q(n){if((n=pl(n))instanceof Cr)return new up(n);if(n instanceof An)return new cp(n);if(n instanceof Kn)return new lp(n);if(n instanceof P){if(n.name==="add")return new dp(n);if(n.name==="subtract")return new mp(n);if(n.name==="multiply")return new pp(n);if(n.name==="divide")return new gp(n);if(n.name==="mod")return new _p(n);if(n.name==="and")return new yp(n);if(n.name==="equal")return new bp(n);if(n.name==="not_equal")return new xp(n);if(n.name==="less_than")return new Dp(n);if(n.name==="less_than_or_equal")return new Np(n);if(n.name==="greater_than")return new kp(n);if(n.name==="greater_than_or_equal")return new Op(n);if(n.name==="array_concat")return new Lp(n);if(n.name==="array_reverse")return new Mp(n);if(n.name==="array_contains")return new Up(n);if(n.name==="array_contains_all")return new Fp(n);if(n.name==="array_contains_any")return new Bp(n);if(n.name==="array_length")return new qp(n);if(n.name==="array_element")return new $p(n);if(n.name==="equal_any")return new gl(n);if(n.name==="not_equal_any")return new Tp(n);if(n.name==="is_nan")return new vp(n);if(n.name==="is_not_nan")return new wp(n);if(n.name==="is_null")return new Ip(n);if(n.name==="is_not_null")return new Ap(n);if(n.name==="is_error")return new Vp(n);if(n.name==="exists")return new Rp(n);if(n.name==="not")return new Ms(n);if(n.name==="or")return new Ep(n);if(n.name==="xor")return new mo(n);if(n.name==="conditional")return new Pp(n);if(n.name==="maximum")return new Sp(n);if(n.name==="minimum")return new Cp(n);if(n.name==="reverse")return new jp(n);if(n.name==="replace_first")return new zp(n);if(n.name==="replace_all")return new Gp(n);if(n.name==="char_length")return new Hp(n);if(n.name==="byte_length")return new Qp(n);if(n.name==="like")return new Kp(n);if(n.name==="regex_contains")return new Wp(n);if(n.name==="regex_match")return new Yp(n);if(n.name==="string_contains")return new Jp(n);if(n.name==="starts_with")return new Xp(n);if(n.name==="ends_with")return new Zp(n);if(n.name==="to_lower")return new tg(n);if(n.name==="to_upper")return new eg(n);if(n.name==="trim")return new ng(n);if(n.name==="string_concat")return new rg(n);if(n.name==="map_get")return new sg(n);if(n.name==="cosine_distance")return new ig(n);if(n.name==="dot_product")return new og(n);if(n.name==="euclidean_distance")return new ag(n);if(n.name==="vector_length")return new ug(n);if(n.name==="unix_micros_to_timestamp")return new dg(n);if(n.name==="timestamp_to_unix_micros")return new gg(n);if(n.name==="unix_millis_to_timestamp")return new mg(n);if(n.name==="timestamp_to_unix_millis")return new _g(n);if(n.name==="unix_seconds_to_timestamp")return new pg(n);if(n.name==="timestamp_to_unix_seconds")return new yg(n);if(n.name==="timestamp_add")return new Eg(n);if(n.name==="timestamp_subtract")return new Tg(n)}throw new Error(`Unknown Expr : ${n}`)}class up{constructor(t){this.expr=t}evaluate(t,e){if(this.expr.fieldName===fn)return E.newValue({referenceValue:gs(t.serializer,e.key)});if(this.expr.fieldName==="__update_time__")return E.newValue({timestampValue:ss(t.serializer,e.version)});if(this.expr.fieldName==="__create_time__")return E.newValue({timestampValue:ss(t.serializer,e.createTime)});const r=e.data.field(this.expr._fieldPath);return r?Vs(r)?E.newValue((function(o,a){if(o.serverTimestampBehavior==="estimate")return{timestampValue:ss(o.serializer,$.fromTimestamp(dn(a)))};if(o.serverTimestampBehavior==="previous"){const c=Vr(a);if(c)return c}return{nullValue:"NULL_VALUE"}})(t,r)):E.newValue(r):E.Sr()}}class cp{constructor(t){this.expr=t}evaluate(t,e){return E.newValue(this.expr._getValue())}}class lp{constructor(t){this.expr=t}evaluate(t,e){const r=this.expr.Rr.map((s=>q(s).evaluate(t,e)));return r.some((s=>s.Cr()))?E.vr():E.newValue({arrayValue:{values:r.map((s=>s.value))}})}}function Et(n){return ze(n)?Number(n.doubleValue):Number(n.integerValue)}function re(n){return BigInt(n.integerValue)}const hp=BigInt("0x7fffffffffffffff"),fp=-BigInt("0x8000000000000000");class br{constructor(t){this.expr=t}evaluate(t,e){M(this.expr.params.length>=2,24778);const r=q(this.expr.params[0]).evaluate(t,e),s=q(this.expr.params[1]).evaluate(t,e);let o=this.Or(r,s);for(const a of this.expr.params.slice(2)){const c=q(a).evaluate(t,e);o=this.Or(o,c)}return o}Or(t,e){if(t.Cr()||e.Cr())return E.vr();if(t.Fr()||e.Fr())return E.Dr();const r=t.value,s=e.value;if(!ze(r)&&!Xt(r)||!ze(s)&&!Xt(s))return E.vr();if(ze(r)||ze(s)){const o=this.Mr(r,s);return o?E.newValue(o):E.vr()}if(Xt(r)&&Xt(s)){const o=this.Nr(r,s);return o===void 0?E.vr():typeof o=="number"?E.newValue({doubleValue:o}):o<fp||o>hp?E.vr():E.newValue({integerValue:`${o}`})}return E.vr()}}function le(n,t){return ht(n)!==ht(t)?"TYPE_MISMATCH":Mt(n)||Mt(t)?"NOT_EQ":qt(n)&&qt(t)?"EQ":qt(n)||qt(t)?"NULL":gn(n)&&gn(t)?(function(r,s){var a,c,h;if(((a=r.values)==null?void 0:a.length)!==((c=s.values)==null?void 0:c.length))return"NOT_EQ";let o=!1;for(let f=0;f<(((h=r.values)==null?void 0:h.length)??0);f++){const m=r.values[f],p=s.values[f];switch(le(m,p)){case"EQ":break;case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":o=!0;break;default:B(44609,{Lr:m,Br:p})}}return o?"NULL":"EQ"})(n.arrayValue,t.arrayValue):cs(n)&&cs(t)||He(n)&&He(t)?(function(r,s){const o=r.fields||{},a=s.fields||{};if(us(o)!==us(a))return"NOT_EQ";let c=!1;for(const h in o)if(o.hasOwnProperty(h)){if(a[h]===void 0)return"NOT_EQ";switch(le(o[h],a[h])){case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":c=!0}}return c?"NULL":"EQ"})(n.mapValue,t.mapValue):(function(r,s){return Gt(r,s,{Te:!1,Ee:!0,he:!0})})(n,t)?"EQ":"NOT_EQ"}class dp extends br{Nr(t,e){return re(t)+re(e)}Mr(t,e){return{doubleValue:Et(t)+Et(e)}}}class mp extends br{constructor(t){super(t),this.expr=t}Nr(t,e){return re(t)-re(e)}Mr(t,e){return{doubleValue:Et(t)-Et(e)}}}class pp extends br{constructor(t){super(t),this.expr=t}Nr(t,e){return re(t)*re(e)}Mr(t,e){return{doubleValue:Et(t)*Et(e)}}}class gp extends br{constructor(t){super(t),this.expr=t}Nr(t,e){const r=re(e);if(r!==BigInt(0))return re(t)/r}Mr(t,e){const r=Et(e);return r===0?{doubleValue:ar(r)?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY}:{doubleValue:Et(t)/r}}}class _p extends br{constructor(t){super(t),this.expr=t}Nr(t,e){const r=re(e);if(r!==BigInt(0))return re(t)%r}Mr(t,e){const r=Et(e);if(r!==0)return{doubleValue:Et(t)%r}}}class yp{constructor(t){this.expr=t}evaluate(t,e){var o;let r=!1,s=!1;for(const a of this.expr.params){const c=q(a).evaluate(t,e);switch(c.type){case"BOOLEAN":if(!((o=c.value)!=null&&o.booleanValue))return E.newValue(_t);break;case"NULL":s=!0;break;default:r=!0}}return r?E.vr():s?E.Dr():E.newValue(Ot)}}class Ms{constructor(t){this.expr=t}evaluate(t,e){var s;M(this.expr.params.length===1,9634);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"BOOLEAN":return E.newValue({booleanValue:!((s=r.value)!=null&&s.booleanValue)});case"NULL":return E.Dr();default:return E.vr()}}}class Ep{constructor(t){this.expr=t}evaluate(t,e){var o;let r=!1,s=!1;for(const a of this.expr.params){const c=q(a).evaluate(t,e);switch(c.type){case"BOOLEAN":if((o=c.value)!=null&&o.booleanValue)return E.newValue(Ot);break;case"NULL":s=!0;break;default:r=!0}}return r?E.vr():s?E.Dr():E.newValue(_t)}}class mo{constructor(t){this.expr=t}evaluate(t,e){var o;let r=!1,s=!1;for(const a of this.expr.params){const c=q(a).evaluate(t,e);switch(c.type){case"BOOLEAN":r=mo.xor(r,!!((o=c.value)!=null&&o.booleanValue));break;case"NULL":s=!0;break;default:return E.vr()}}return s?E.Dr():E.newValue({booleanValue:r})}static xor(t,e){return(t||e)&&!(t&&e)}}class gl{constructor(t){this.expr=t}evaluate(t,e){var a,c;M(this.expr.params.length===2,55094);let r=!1;const s=q(this.expr.params[0]).evaluate(t,e);switch(s.type){case"NULL":r=!0;break;case"ERROR":case"UNSET":return E.vr()}const o=q(this.expr.params[1]).evaluate(t,e);switch(o.type){case"ARRAY":break;case"NULL":r=!0;break;default:return E.vr()}if(r)return E.Dr();for(const h of((c=(a=o.value)==null?void 0:a.arrayValue)==null?void 0:c.values)??[])switch(qt(s.value)&&qt(h)?"EQ":le(s.value,h)){case"EQ":return E.newValue(Ot);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":r=!0;break;default:B(44608,{value:s.value,candidate:h})}return r?E.Dr():E.newValue(_t)}}class Tp{constructor(t){this.expr=t}evaluate(t,e){return new Ms(new P("not",[new P("equal_any",this.expr.params)])).evaluate(t,e)}}class vp{constructor(t){this.expr=t}evaluate(t,e){M(this.expr.params.length===1,23322);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"INT":return E.newValue(_t);case"DOUBLE":return E.newValue({booleanValue:isNaN(Et(r.value))});case"NULL":return E.Dr();default:return E.vr()}}}class wp{constructor(t){this.expr=t}evaluate(t,e){return M(this.expr.params.length===1,50406),new Ms(new P("not",[new P("is_nan",this.expr.params)])).evaluate(t,e)}}class Ip{constructor(t){this.expr=t}evaluate(t,e){switch(M(this.expr.params.length===1,23123),q(this.expr.params[0]).evaluate(t,e).type){case"NULL":return E.newValue(Ot);case"UNSET":case"ERROR":return E.vr();default:return E.newValue(_t)}}}class Ap{constructor(t){this.expr=t}evaluate(t,e){return M(this.expr.params.length===1,23167),new Ms(new P("not",[new P("is_null",this.expr.params)])).evaluate(t,e)}}class Vp{constructor(t){this.expr=t}evaluate(t,e){return M(this.expr.params.length===1,5228),q(this.expr.params[0]).evaluate(t,e).type==="ERROR"?E.newValue(Ot):E.newValue(_t)}}class Rp{constructor(t){this.expr=t}evaluate(t,e){switch(M(this.expr.params.length===1,6877),q(this.expr.params[0]).evaluate(t,e).type){case"ERROR":return E.vr();case"UNSET":return E.newValue(_t);default:return E.newValue(Ot)}}}class Pp{constructor(t){this.expr=t}evaluate(t,e){var s;M(this.expr.params.length===3,11706);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"BOOLEAN":return(s=r.value)!=null&&s.booleanValue?q(this.expr.params[1]).evaluate(t,e):q(this.expr.params[2]).evaluate(t,e);case"NULL":return q(this.expr.params[2]).evaluate(t,e);default:return E.vr()}}}class Sp{constructor(t){this.expr=t}evaluate(t,e){const r=this.expr.params.map((o=>q(o).evaluate(t,e)));let s;for(const o of r)switch(o.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||Lt(o.value,s.value)>0?o:s}return s===void 0?E.Dr():s}}class Cp{constructor(t){this.expr=t}evaluate(t,e){const r=this.expr.params.map((o=>q(o).evaluate(t,e)));let s;for(const o of r)switch(o.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||Lt(o.value,s.value)<0?o:s}return s===void 0?E.Dr():s}}class Vn{constructor(t){this.expr=t}evaluate(t,e){M(this.expr.params.length===2,31033,`${this.expr.name}() function should have exactly 2 params`);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"ERROR":case"UNSET":return E.vr()}const s=q(this.expr.params[1]).evaluate(t,e);switch(s.type){case"ERROR":case"UNSET":return E.vr()}return this.Ur(r,s)}}class bp extends Vn{constructor(t){super(t),this.expr=t}Ur(t,e){if(t.Fr()&&e.Fr())return E.newValue(Ot);if(t.Fr()||e.Fr()||Mt(t.value)||Mt(e.value)||ht(t.value)!==ht(e.value))return E.newValue(_t);switch(le(t.value,e.value)){case"EQ":return E.newValue(Ot);case"NOT_EQ":return E.newValue(_t);case"NULL":return E.Dr();default:B(44615,{left:t,right:e})}}}class xp extends Vn{constructor(t){super(t),this.expr=t}Ur(t,e){switch(le(t.value,e.value)){case"EQ":return E.newValue(_t);case"NOT_EQ":case"TYPE_MISMATCH":return E.newValue(Ot);case"NULL":return E.Dr();default:B(44614,{left:t,right:e})}}}class Dp extends Vn{constructor(t){super(t),this.expr=t}Ur(t,e){return ht(t.value)!==ht(e.value)||Mt(t.value)||Mt(e.value)?E.newValue(_t):E.newValue({booleanValue:Lt(t.value,e.value)<0})}}class Np extends Vn{constructor(t){super(t),this.expr=t}Ur(t,e){return ht(t.value)!==ht(e.value)||Mt(t.value)||Mt(e.value)?E.newValue(_t):le(t.value,e.value)==="EQ"?E.newValue(Ot):E.newValue({booleanValue:Lt(t.value,e.value)<0})}}class kp extends Vn{constructor(t){super(t),this.expr=t}Ur(t,e){return ht(t.value)!==ht(e.value)||Mt(t.value)||Mt(e.value)?E.newValue(_t):E.newValue({booleanValue:Lt(t.value,e.value)>0})}}class Op extends Vn{constructor(t){super(t),this.expr=t}Ur(t,e){return ht(t.value)!==ht(e.value)||Mt(t.value)||Mt(e.value)?E.newValue(_t):le(t.value,e.value)==="EQ"?E.newValue(Ot):E.newValue({booleanValue:Lt(t.value,e.value)>0})}}class Lp{constructor(t){this.expr=t}evaluate(t,e){throw new Error("Unimplemented")}}class Mp{constructor(t){this.expr=t}evaluate(t,e){var s;M(this.expr.params.length===1,216);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"NULL":return E.Dr();case"ARRAY":{const o=((s=r.value.arrayValue)==null?void 0:s.values)??[];return E.newValue({arrayValue:{values:[...o].reverse()}})}default:return E.vr()}}}class Up{constructor(t){this.expr=t}evaluate(t,e){return M(this.expr.params.length===2,52884),new gl(new P("eq_any",[this.expr.params[1],this.expr.params[0]])).evaluate(t,e)}}class Fp{constructor(t){this.expr=t}evaluate(t,e){var h,f,m,p;M(this.expr.params.length===2,1392);let r=!1;const s=q(this.expr.params[0]).evaluate(t,e);switch(s.type){case"ARRAY":break;case"NULL":r=!0;break;default:return E.vr()}const o=q(this.expr.params[1]).evaluate(t,e);switch(o.type){case"ARRAY":break;case"NULL":r=!0;break;default:return E.vr()}if(r)return E.Dr();const a=((f=(h=o.value)==null?void 0:h.arrayValue)==null?void 0:f.values)??[],c=((p=(m=s.value)==null?void 0:m.arrayValue)==null?void 0:p.values)??[];for(const I of a){let b=!1;r=!1;for(const x of c){switch(qt(I)&&qt(x)?"EQ":le(I,x)){case"EQ":b=!0;break;case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":r=!0;break;default:B(44613,{value:x,search:I})}if(b)break}if(!b)return E.newValue(_t)}return E.newValue(Ot)}}class Bp{constructor(t){this.expr=t}evaluate(t,e){var h,f,m,p;M(this.expr.params.length===2,2680);let r=!1;const s=q(this.expr.params[0]).evaluate(t,e);switch(s.type){case"ARRAY":break;case"NULL":r=!0;break;default:return E.vr()}const o=q(this.expr.params[1]).evaluate(t,e);switch(o.type){case"ARRAY":break;case"NULL":r=!0;break;default:return E.vr()}if(r)return E.Dr();const a=((f=(h=o.value)==null?void 0:h.arrayValue)==null?void 0:f.values)??[],c=((p=(m=s.value)==null?void 0:m.arrayValue)==null?void 0:p.values)??[];for(const I of c)for(const b of a)switch(qt(I)&&qt(b)?"EQ":le(I,b)){case"EQ":return E.newValue(Ot);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":r=!0;break;default:B(44608,{value:I,search:b})}return r?E.Dr():E.newValue(_t)}}class qp{constructor(t){this.expr=t}evaluate(t,e){var s,o,a;M(this.expr.params.length===1,38605);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"NULL":return E.Dr();case"ARRAY":return E.newValue({integerValue:`${((a=(o=(s=r.value)==null?void 0:s.arrayValue)==null?void 0:o.values)==null?void 0:a.length)??0}`});default:return E.vr()}}}class $p{constructor(t){this.expr=t}evaluate(t,e){throw new Error("Unimplemented")}}class jp{constructor(t){this.expr=t}evaluate(t,e){var s,o;M(this.expr.params.length===1,1508);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"NULL":return E.Dr();case"BYTES":{const a=(s=r.value)==null?void 0:s.bytesValue;if(typeof a=="string"){const c=lt.fromBase64String(a).toUint8Array();return c.reverse(),E.newValue({bytesValue:lt.fromUint8Array(c).toBase64()})}return E.newValue({bytesValue:new Uint8Array(a).reverse()})}case"STRING":{const a=(o=r.value)==null?void 0:o.stringValue,c=new Intl.__PRIVATE_Segmenter(void 0,{granularity:"grapheme"}).segment(a),h=Array.from(c,(f=>f.segment)).reverse();return E.newValue({stringValue:h.join("")})}default:return E.vr()}}}class zp{constructor(t){this.expr=t}evaluate(t,e){throw new Error("Unimplemented")}}class Gp{constructor(t){this.expr=t}evaluate(t,e){throw new Error("Unimplemented")}}class Hp{constructor(t){this.expr=t}evaluate(t,e){M(this.expr.params.length===1,19400);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"NULL":return E.Dr();case"STRING":{const s=(function(a){let c=0;for(let h=0;h<a.length;h++){const f=a.codePointAt(h);if(f===void 0)return;if(f<=65535)if(f>=55296&&f<=57343)if(f<=56319){const m=a.codePointAt(h+1);m!==void 0&&m>=56320&&m<=57343?(c+=1,h++):c+=1}else c+=1;else c+=1;else{if(!(f<=1114111))return;c+=1,h++}}return c})(r.value.stringValue);return s===void 0?E.vr():E.newValue({integerValue:s})}default:return E.vr()}}}class Qp{constructor(t){this.expr=t}evaluate(t,e){var s,o;M(this.expr.params.length===1,8486);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"BYTES":{const a=(s=r.value)==null?void 0:s.bytesValue;return typeof a=="string"?E.newValue({integerValue:lt.fromBase64String(a).toUint8Array().length}):E.newValue({integerValue:new Uint8Array(a).length})}case"STRING":{const a=(function(h){let f=0;for(let m=0;m<h.length;m++){const p=h.codePointAt(m);if(p===void 0)return;if(p>=55296&&p<=57343){if(!(p<=56319))return;{const I=h.codePointAt(m+1);if(I===void 0||!(I>=56320&&I<=57343))return;f+=4,m++}}else if(p<=127)f+=1;else if(p<=2047)f+=2;else if(p<=65535)f+=3;else{if(!(p<=1114111))return;f+=4,m++}}return f})((o=r.value)==null?void 0:o.stringValue);return a===void 0?E.vr():E.newValue({integerValue:a})}case"NULL":return E.Dr();default:return E.vr()}}}class Rn{constructor(t){this.expr=t}evaluate(t,e){var a,c;M(this.expr.params.length===2,39773,`${this.expr.name}() function should have exactly two parameters`);let r=!1;const s=q(this.expr.params[0]).evaluate(t,e);switch(s.type){case"STRING":break;case"NULL":r=!0;break;default:return E.vr()}const o=q(this.expr.params[1]).evaluate(t,e);switch(o.type){case"STRING":break;case"NULL":r=!0;break;default:return E.vr()}return r?E.Dr():this.kr((a=s.value)==null?void 0:a.stringValue,(c=o.value)==null?void 0:c.stringValue)}}class Kp extends Rn{kr(t,e){try{const r=(function(a){let c="";for(let h=0;h<a.length;h++){const f=a.charAt(h);switch(f){case"_":c+=".";break;case"%":c+=".*";break;case"\\":case".":case"*":case"?":case"+":case"^":case"$":case"|":case"(":case")":case"[":case"]":case"{":case"}":c+="\\"+f;break;default:c+=f}}return"^"+c+"$"})(e),s=qi.compile(r);return E.newValue({booleanValue:s.matches(t)})}catch(r){return Qt(`Invalid LIKE pattern converted to regex: ${e}, returning error. Error: ${r}`),E.vr()}}}class Wp extends Rn{kr(t,e){try{const r=qi.compile(e);return E.newValue({booleanValue:r.matcher(t).find()})}catch{return Qt(`Invalid regex pattern found in regex_contains: ${e}, returning error`),E.vr()}}}class Yp extends Rn{kr(t,e){try{return E.newValue({booleanValue:qi.compile(e).matches(t)})}catch{return Qt(`Invalid regex pattern found in regex_match: ${e}, returning error`),E.vr()}}}class Jp extends Rn{kr(t,e){return E.newValue({booleanValue:t.includes(e)})}}class Xp extends Rn{kr(t,e){return E.newValue({booleanValue:t.startsWith(e)})}}class Zp extends Rn{kr(t,e){return E.newValue({booleanValue:t.endsWith(e)})}}class tg{constructor(t){this.expr=t}evaluate(t,e){var s,o;M(this.expr.params.length===1,29079);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"STRING":return E.newValue({stringValue:(o=(s=r.value)==null?void 0:s.stringValue)==null?void 0:o.toLowerCase()});case"NULL":return E.Dr();default:return E.vr()}}}class eg{constructor(t){this.expr=t}evaluate(t,e){var s,o;M(this.expr.params.length===1,60487);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"STRING":return E.newValue({stringValue:(o=(s=r.value)==null?void 0:s.stringValue)==null?void 0:o.toUpperCase()});case"NULL":return E.Dr();default:return E.vr()}}}class ng{constructor(t){this.expr=t}evaluate(t,e){var s,o;M(this.expr.params.length===1,28544);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"STRING":return E.newValue({stringValue:(o=(s=r.value)==null?void 0:s.stringValue)==null?void 0:o.trim()});case"NULL":return E.Dr();default:return E.vr()}}}class rg{constructor(t){this.expr=t}evaluate(t,e){const r=this.expr.params.map((a=>q(a).evaluate(t,e)));let s="",o=!1;for(const a of r)switch(a.type){case"STRING":s+=a.value.stringValue;break;case"NULL":o=!0;break;default:return E.vr()}return o?E.Dr():E.newValue({stringValue:s})}}class sg{constructor(t){this.expr=t}evaluate(t,e){var a,c,h,f;M(this.expr.params.length===2,4483);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"UNSET":return E.Sr();case"MAP":break;default:return E.vr()}const s=q(this.expr.params[1]).evaluate(t,e);if(s.type!=="STRING")return E.vr();const o=(f=(c=(a=r.value)==null?void 0:a.mapValue)==null?void 0:c.fields)==null?void 0:f[(h=s.value)==null?void 0:h.stringValue];return o===void 0?E.Sr():E.newValue(o)}}class po{constructor(t){this.expr=t}evaluate(t,e){var f,m;M(this.expr.params.length===2,25231,`${this.expr.name}() function should have exactly 2 params`);let r=!1;const s=q(this.expr.params[0]).evaluate(t,e);switch(s.type){case"VECTOR":break;case"NULL":r=!0;break;default:return E.vr()}const o=q(this.expr.params[1]).evaluate(t,e);switch(o.type){case"VECTOR":break;case"NULL":r=!0;break;default:return E.vr()}if(r)return E.Dr();const a=Ri(s.value),c=Ri(o.value);if(a===void 0||c===void 0||((f=a.values)==null?void 0:f.length)!==((m=c.values)==null?void 0:m.length))return E.vr();const h=this.qr(a,c);return h===void 0||isNaN(h)?E.vr():E.newValue({doubleValue:h})}}class ig extends po{qr(t,e){const r=(t==null?void 0:t.values)??[],s=(e==null?void 0:e.values)??[];if(r.length===0)return;let o=0,a=0,c=0;for(let f=0;f<r.length;f++){if(!Pe(r[f])||!Pe(s[f]))return;const m=Et(r[f]),p=Et(s[f]);o+=m*p,a+=m*m,c+=p*p}const h=Math.sqrt(a)*Math.sqrt(c);if(h!==0)return 1-Math.max(-1,Math.min(1,o/h))}}class og extends po{qr(t,e){const r=(t==null?void 0:t.values)??[],s=(e==null?void 0:e.values)??[];if(r.length===0)return 0;let o=0;for(let a=0;a<r.length;a++){if(!Pe(r[a])||!Pe(s[a]))return;o+=Et(r[a])*Et(s[a])}return o}}class ag extends po{qr(t,e){const r=(t==null?void 0:t.values)??[],s=(e==null?void 0:e.values)??[];if(r.length===0)return 0;let o=0;for(let a=0;a<r.length;a++){if(!Pe(r[a])||!Pe(s[a]))return;const c=Et(r[a]),h=Et(s[a]);o+=Math.pow(c-h,2)}return Math.sqrt(o)}}class ug{constructor(t){this.expr=t}evaluate(t,e){var s;M(this.expr.params.length===1,39044);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"VECTOR":{const o=Ri(r.value);return E.newValue({integerValue:((s=o==null?void 0:o.values)==null?void 0:s.length)??0})}case"NULL":return E.Dr();default:return E.vr()}}}const Er=BigInt(-62135596800),Tr=BigInt(253402300799),ys=BigInt(1e3),we=BigInt(1e6),cg=Er*ys,lg=Tr*ys+BigInt(999),hg=Er*we,fg=Tr*we+BigInt(999999);function go(n){return n>=hg&&n<=fg}function _l(n){return n>=Er&&n<=Tr}function vr(n,t){const e=BigInt(n);return!(e<Er||e>Tr)&&!(t<0||t>=1e9)&&(e!==Er||t===0)&&!(e===Tr&&t>999999999)}function yl(n,t){return t<0?{seconds:n-1,nanos:t+1e9}:{seconds:n,nanos:t}}function _o(n){return BigInt(n.seconds)*we+BigInt(Math.trunc(n.nanoseconds/1e3))}class yo{constructor(t){this.expr=t}evaluate(t,e){M(this.expr.params.length===1,49262,`${this.expr.name}() function should have exactly one parameter`);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"INT":return this.toTimestamp(BigInt(r.value.integerValue));case"NULL":return E.Dr();default:return E.vr()}}}class dg extends yo{toTimestamp(t){if(!go(t))return E.vr();let e=Number(t/we),r=Number(t%we*BigInt(1e3));const s=yl(e,r);return e=s.seconds,r=s.nanos,vr(e,r)?E.newValue({timestampValue:{seconds:e,nanos:r}}):E.vr()}}class mg extends yo{toTimestamp(t){if(!(function(a){return a>=cg&&a<=lg})(t))return E.vr();let e=Number(t/ys),r=Number(t%ys*BigInt(1e6));const s=yl(e,r);return e=s.seconds,r=s.nanos,vr(e,r)?E.newValue({timestampValue:{seconds:e,nanos:r}}):E.vr()}}class pg extends yo{toTimestamp(t){if(!_l(t))return E.vr();const e=Number(t);return E.newValue({timestampValue:{seconds:e,nanos:0}})}}class Eo{constructor(t){this.expr=t}evaluate(t,e){M(this.expr.params.length===1,1265,`${this.expr.name}() function should have exactly one parameter`);const r=q(this.expr.params[0]).evaluate(t,e);switch(r.type){case"TIMESTAMP":break;case"NULL":return E.Dr();default:return E.vr()}const s=to(r.value.timestampValue);return vr(s.seconds,s.nanoseconds)?this.$r(s):E.vr()}}class gg extends Eo{$r(t){const e=_o(t);return go(e)?E.newValue({integerValue:`${e.toString()}`}):E.vr()}}class _g extends Eo{$r(t){const e=_o(t),r=e/BigInt(1e3),s=e%BigInt(1e3);return r>BigInt(0)||s===BigInt(0)?E.newValue({integerValue:r.toString()}):E.newValue({integerValue:(r-BigInt(1)).toString()})}}class yg extends Eo{$r(t){const e=BigInt(t.seconds);return _l(e)?E.newValue({integerValue:e.toString()}):E.vr()}}class El{constructor(t){this.expr=t}evaluate(t,e){M(this.expr.params.length===3,2775,`${this.expr.name}() function should have exactly 3 parameters`);let r=!1;const s=q(this.expr.params[0]).evaluate(t,e);switch(s.type){case"TIMESTAMP":break;case"NULL":r=!0;break;default:return E.vr()}const o=q(this.expr.params[1]).evaluate(t,e);let a;switch(o.type){case"STRING":if(a=(function(J){switch(J){case"microsecond":return"microsecond";case"millisecond":return"millisecond";case"second":return"second";case"minute":return"minute";case"hour":return"hour";case"day":return"day";default:return}})(o.value.stringValue),a===void 0)return E.vr();break;case"NULL":r=!0;break;default:return E.vr()}const c=q(this.expr.params[2]).evaluate(t,e);switch(c.type){case"INT":break;case"NULL":r=!0;break;default:return E.vr()}if(r)return E.Dr();const h=BigInt(c.value.integerValue);let f;try{switch(a){case"microsecond":f=h;break;case"millisecond":f=h*BigInt(1e3);break;case"second":f=h*BigInt(1e6);break;case"minute":f=h*BigInt(6e7);break;case"hour":f=h*BigInt(36e8);break;case"day":f=h*BigInt(864e8);break;default:return E.vr()}if(a!=="microsecond"&&h!==BigInt(0)&&f/h!==BigInt(this.Kr(a)))return E.vr()}catch(Q){return Qt(`Error during timestamp arithmetic: ${Q}`),E.vr()}const m=to(s.value.timestampValue);if(!vr(m.seconds,m.nanoseconds))return E.vr();const p=_o(m),I=this.Wr(p,f);if(!go(I))return E.vr();const b=Number(I/we),x=I%we,U=Number((x<0?x+we:x)*BigInt(1e3)),L=x<0?b-1:b;return vr(L,U)?E.newValue({timestampValue:{seconds:L,nanos:U}}):E.vr()}Kr(t){switch(t){case"millisecond":return 1e3;case"second":return 1e6;case"minute":return 6e7;case"hour":return 36e8;case"day":return 864e8;default:return 1}}}class Eg extends El{Wr(t,e){return t+e}}class Tg extends El{Wr(t,e){return t-e}}function wr(n){if((n=pl(n))instanceof Cr)return`fld(${n.fieldName})`;if(n instanceof An)return`cst(${(function(e){return e===null?"null":typeof e=="number"?e.toString():typeof e=="string"?`"${e}"`:e instanceof it?`ref(${e.path})`:e instanceof kt?`vec(${JSON.stringify(e)})`:JSON.stringify(e)})(n.value)})`;if(n instanceof P)return`fn(${n.name},[${n.params.map(wr).join(",")}])`;if(n.expressionType==="ListOfExpressions")return`list([${n.Rr.map(wr).join(",")}])`;throw new Error(`Unrecognized expr ${JSON.stringify(n,null,2)}`)}function vg(n){if(n instanceof fl)return`${n._name}(${Zr(n.fields)})`;if(n instanceof dl){let t=`${n._name}(${Zr(n.accumulators)})`;return n.groups.size>0&&(t+=`grouping(${Zr(n.groups)})`),t}if(n instanceof ml)return`${n._name}(${Zr(n.groups)})`;if(n instanceof ks)return`${n._name}(${n.Vr})`;if(n instanceof Os)return`${n._name}(${n.collectionId})`;if(n instanceof ao)return`${n._name}()`;if(n instanceof uo)return`${n._name}(${n.dr.sort()})`;if(n instanceof co)return`${n._name}(${wr(n.condition)})`;if(n instanceof yr)return`${n._name}(${n.limit})`;if(n instanceof lo)return`${n._name}(${(function(e){return e.map((r=>`${wr(r.expr)}${r.direction}`)).join(",")})(n.orderings)})`;throw new Error(`Unrecognized stage ${n._name}`)}function Zr(n){return`${Array.from(n.entries()).sort().map((([t,e])=>`${t}=${wr(e)}`)).join(",")}`}function ae(n){return n.stages.map((t=>vg(t))).join("|")}function Tl(n,t){return ae(n)===ae(t)}function mt(n){return n instanceof Dt}function Pu(n){return mt(n)?ae(n):Zn(n)}function vl(n){return mt(n)?ae(n):(function(e){return`${xc(Zt(e))}|lt:${e.limitType}`})(n)}function Us(n,t){return n instanceof Dt&&t instanceof Dt?Tl(n,t):!(n instanceof Dt&&!(t instanceof Dt)||!(n instanceof Dt)&&t instanceof Dt)&&Qd(n,t)}function wl(n){return je(n)?ae(n):xc(n)}function Il(n,t){return n instanceof Dt&&t instanceof Dt?Tl(n,t):!(n instanceof Dt&&!(t instanceof Dt)||!(n instanceof Dt)&&t instanceof Dt)&&Dc(n,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wg{constructor(t,e,r,s){this.batchId=t,this.localWriteTime=e,this.baseMutations=r,this.mutations=s}applyToRemoteDocument(t,e){const r=e.mutationResults;for(let s=0;s<this.mutations.length;s++){const o=this.mutations[s];o.key.isEqual(t.key)&&bd(o,t,r[s])}}applyToLocalView(t,e){for(const r of this.baseMutations)r.key.isEqual(t.key)&&(e=Jn(r,t,e,this.localWriteTime));for(const r of this.mutations)r.key.isEqual(t.key)&&(e=Jn(r,t,e,this.localWriteTime));return e}applyToLocalDocumentSet(t,e){const r=Uc();return this.mutations.forEach((s=>{const o=t.get(s.key),a=o.overlayedDocument;let c=this.applyToLocalView(a,o.mutatedFields);c=e.has(s.key)?null:c;const h=Ic(a,c);h!==null&&r.set(s.key,h),a.isValidDocument()||a.convertToNoDocument($.min())})),r}keys(){return this.mutations.reduce(((t,e)=>t.add(e.key)),G())}isEqual(t){return this.batchId===t.batchId&&hn(this.mutations,t.mutations,((e,r)=>iu(e,r)))&&hn(this.baseMutations,t.baseMutations,((e,r)=>iu(e,r)))}}class To{constructor(t,e,r,s){this.batch=t,this.commitVersion=e,this.mutationResults=r,this.docVersions=s}static from(t,e,r){M(t.mutations.length===r.length,58842,{Qr:t.mutations.length,Gr:r.length});let s=(function(){return Xd})();const o=t.mutations;for(let a=0;a<o.length;a++)s=s.insert(o[a].key,r[a].version);return new To(t,e,r,s)}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ig{constructor(t,e){this.largestBatchId=t,this.mutation=e}getKey(){return this.mutation.key}isEqual(t){return t!==null&&this.mutation===t.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ie{constructor(t,e,r,s,o=$.min(),a=$.min(),c=lt.EMPTY_BYTE_STRING,h=null){this.target=t,this.targetId=e,this.purpose=r,this.sequenceNumber=s,this.snapshotVersion=o,this.lastLimboFreeSnapshotVersion=a,this.resumeToken=c,this.expectedCount=h}withSequenceNumber(t){return new ie(this.target,this.targetId,this.purpose,t,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(t,e){return new ie(this.target,this.targetId,this.purpose,this.sequenceNumber,e,this.lastLimboFreeSnapshotVersion,t,null)}withExpectedCount(t){return new ie(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,t)}withLastLimboFreeSnapshotVersion(t){return new ie(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,t,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ag{constructor(t){this.zr=t}}function Vg(n){const t=pm({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?Ci(t,t.limit,"L"):t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rg{constructor(){this.Hi=new Pg}addToCollectionParentIndex(t,e){return this.Hi.add(e),C.resolve()}getCollectionParents(t,e){return C.resolve(this.Hi.getEntries(e))}addFieldIndex(t,e){return C.resolve()}deleteFieldIndex(t,e){return C.resolve()}deleteAllFieldIndexes(t){return C.resolve()}createTargetIndexes(t,e){return C.resolve()}getDocumentsMatchingTarget(t,e){return C.resolve(null)}getIndexType(t,e){return C.resolve(0)}getFieldIndexes(t,e){return C.resolve([])}getNextCollectionGroupToUpdate(t){return C.resolve(null)}getMinOffset(t,e){return C.resolve(Ae.min())}getMinOffsetFromCollectionGroup(t,e){return C.resolve(Ae.min())}updateCollectionGroup(t,e,r){return C.resolve()}updateIndexEntries(t,e){return C.resolve()}}class Pg{constructor(){this.index={}}add(t){const e=t.lastSegment(),r=t.popLast(),s=this.index[e]||new ct(Y.comparator),o=!s.has(r);return this.index[e]=s.add(r),o}has(t){const e=t.lastSegment(),r=t.popLast(),s=this.index[e];return s&&s.has(r)}getEntries(t){return(this.index[t]||new ct(Y.comparator)).toArray()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xe{constructor(t){this.Ds=t}next(){return this.Ds+=2,this.Ds}static xs(){return new xe(0)}static Cs(){return new xe(-1)}}// Copyright 2024 Google LLC* @license
function Al(n,t){var r;let e=t;for(const s of n.stages)e=Cg({serializer:n.serializer,serverTimestampBehavior:(r=n.listenOptions)==null?void 0:r.serverTimestampBehavior},s,e);return e}function Fs(n,t){return Al(n,[t]).length>0}function Sg(n,t){return mt(n)?Fs(n,t):Cs(n,t)}function Cg(n,t,e){if(t instanceof ks)return(function(s,o,a){return a.filter((c=>c.isFoundDocument()&&`/${c.key.getCollectionPath().canonicalString()}`===o.Vr))})(0,t,e);if(t instanceof co)return(function(s,o,a){return a.filter((c=>{const h=er(q(o.condition).evaluate(s,c));return h!==void 0&&Gt(h,Ot)}))})(n,t,e);if(t instanceof Os)return(function(s,o,a){return a.filter((c=>c.isFoundDocument()&&c.key.getCollectionPath().lastSegment()===o.collectionId))})(0,t,e);if(t instanceof ao)return(function(s,o,a){return a.filter((c=>c.isFoundDocument()))})(0,0,e);if(t instanceof uo)return(function(s,o,a){return a.filter((c=>c.isFoundDocument()&&o.mr.has(c.key.path.toStringWithLeadingSlash())))})(0,t,e);if(t instanceof yr)return(function(s,o,a){return a.slice(0,o.limit)})(0,t,e);if(t instanceof lo)return(function(s,o,a){const c=o.orderings.map((h=>({ks:q(h.expr),direction:h.direction})));return[...a].sort(((h,f)=>{for(const{ks:m,direction:p}of c){const I=er(m.evaluate(s,h)),b=er(m.evaluate(s,f)),x=Lt(I??mn,b??mn);if(x!==0)return p==="ascending"?x:-x}return 0}))})(n,t,e);throw new Error(`Unknown stage: ${t._name}`)}function Oi(n){const t=(function(r){for(let s=r.stages.length-1;s>=0;s--){const o=r.stages[s];if(o instanceof lo)return o.orderings}throw new Error("Pipeline must contain at least one Sort stage")})(n);return(e,r)=>{for(const s of t){const o=er(q(s.expr).evaluate({serializer:n.serializer},e)),a=er(q(s.expr).evaluate({serializer:n.serializer},r)),c=Lt(o||mn,a||mn);if(c!==0)return s.direction==="ascending"?c:-c}return 0}}function _i(n){for(let t=n.stages.length-1;t>=0;t--){const e=n.stages[t];if(e instanceof yr)return{limit:e.limit}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bg{constructor(){this.changes=new Ye((t=>t.toString()),((t,e)=>t.isEqual(e))),this.changesApplied=!1}addEntry(t){this.assertNotApplied(),this.changes.set(t.key,t)}removeEntry(t,e){this.assertNotApplied(),this.changes.set(t,Vt.newInvalidDocument(t).setReadTime(e))}getEntry(t,e){this.assertNotApplied();const r=this.changes.get(e);return r!==void 0?C.resolve(r):this.getFromCache(t,e)}getEntries(t,e){return this.getAllFromCache(t,e)}apply(t){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(t)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xg{constructor(t,e){this.overlayedDocument=t,this.mutatedFields=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dg{constructor(t,e,r,s){this.remoteDocumentCache=t,this.mutationQueue=e,this.documentOverlayCache=r,this.indexManager=s}getDocument(t,e){let r=null;return this.documentOverlayCache.getOverlay(t,e).next((s=>(r=s,this.remoteDocumentCache.getEntry(t,e)))).next((s=>(r!==null&&Jn(r.mutation,s,Bt.empty(),tt.now()),s)))}getDocuments(t,e){return this.remoteDocumentCache.getEntries(t,e).next((r=>this.getLocalViewOfDocuments(t,r,G()).next((()=>r))))}getLocalViewOfDocuments(t,e,r=G()){const s=_e();return this.populateOverlays(t,s,e).next((()=>this.computeViews(t,e,s,r).next((o=>{let a=sn();return o.forEach(((c,h)=>{a=a.insert(c,h.overlayedDocument)})),a}))))}getOverlayedDocuments(t,e){const r=_e();return this.populateOverlays(t,r,e).next((()=>this.computeViews(t,e,r,G())))}populateOverlays(t,e,r){const s=[];return r.forEach((o=>{e.has(o)||s.push(o)})),this.documentOverlayCache.getOverlays(t,s).next((o=>{o.forEach(((a,c)=>{e.set(a,c)}))}))}computeViews(t,e,r,s){let o=Nt();const a=tr(),c=(function(){return tr()})();return e.forEach(((h,f)=>{const m=r.get(f.key);s.has(f.key)&&(m===void 0||m.mutation instanceof Oe)?o=o.insert(f.key,f):m!==void 0?(a.set(f.key,m.mutation.getFieldMask()),Jn(m.mutation,f,m.mutation.getFieldMask(),tt.now())):a.set(f.key,Bt.empty())})),this.recalculateAndSaveOverlays(t,o).next((h=>(h.forEach(((f,m)=>a.set(f,m))),e.forEach(((f,m)=>c.set(f,new xg(m,a.get(f)??null)))),c)))}recalculateAndSaveOverlays(t,e){const r=tr();let s=new et(((a,c)=>a-c)),o=G();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(t,e).next((a=>{for(const c of a)c.keys().forEach((h=>{const f=e.get(h);if(f===null)return;let m=r.get(h)||Bt.empty();m=c.applyToLocalView(f,m),r.set(h,m);const p=(s.get(c.batchId)||G()).add(h);s=s.insert(c.batchId,p)}))})).next((()=>{const a=[],c=s.getReverseIterator();for(;c.hasNext();){const h=c.getNext(),f=h.key,m=h.value,p=Uc();m.forEach((I=>{if(!o.has(I)){const b=Ic(e.get(I),r.get(I));b!==null&&p.set(I,b),o=o.add(I)}})),a.push(this.documentOverlayCache.saveOverlays(t,f,p))}return C.waitFor(a)})).next((()=>r))}recalculateAndSaveOverlaysForDocumentKeys(t,e){return this.remoteDocumentCache.getEntries(t,e).next((r=>this.recalculateAndSaveOverlays(t,r)))}getDocumentsMatchingQuery(t,e,r,s){return mt(e)?this.getDocumentsMatchingPipeline(t,e,r,s):zd(e)?this.getDocumentsMatchingDocumentQuery(t,e.path):kc(e)?this.getDocumentsMatchingCollectionGroupQuery(t,e,r,s):this.getDocumentsMatchingCollectionQuery(t,e,r,s)}getNextDocuments(t,e,r,s){return this.remoteDocumentCache.getAllFromCollectionGroup(t,e,r,s).next((o=>{const a=s-o.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(t,e,r.largestBatchId,s-o.size):C.resolve(_e());let c=or,h=o;return a.next((f=>C.forEach(f,((m,p)=>(c<p.largestBatchId&&(c=p.largestBatchId),o.get(m)?C.resolve():this.remoteDocumentCache.getEntry(t,m).next((I=>{h=h.insert(m,I)}))))).next((()=>this.populateOverlays(t,f,o))).next((()=>this.computeViews(t,h,f,G()))).next((m=>({batchId:c,changes:Mc(m)})))))}))}getDocumentsMatchingDocumentQuery(t,e){return this.getDocument(t,new F(e)).next((r=>{let s=sn();return r.isFoundDocument()&&(s=s.insert(r.key,r)),s}))}getDocumentsMatchingCollectionGroupQuery(t,e,r,s){const o=e.collectionGroup;let a=sn();return this.indexManager.getCollectionParents(t,o).next((c=>C.forEach(c,(h=>{const f=(function(p,I){return new In(I,null,p.explicitOrderBy.slice(),p.filters.slice(),p.limit,p.limitType,p.startAt,p.endAt)})(e,h.child(o));return this.getDocumentsMatchingCollectionQuery(t,f,r,s).next((m=>{m.forEach(((p,I)=>{a=a.insert(p,I)}))}))})).next((()=>a))))}getDocumentsMatchingCollectionQuery(t,e,r,s){let o;return this.documentOverlayCache.getOverlaysForCollection(t,e.path,r.largestBatchId).next((a=>(o=a,this.remoteDocumentCache.getDocumentsMatchingQuery(t,e,r,o,s)))).next((a=>this.retrieveMatchingLocalDocuments(o,a,(c=>Cs(e,c)))))}getDocumentsMatchingPipeline(t,e,r,s){if(ve(e)==="collection_group"){const o=fo(e);let a=sn();return this.indexManager.getCollectionParents(t,o).next((c=>C.forEach(c,(h=>{const f=(function(p,I){const b=p.stages.map((x=>x instanceof Os?new ks(I.canonicalString(),{}):x));return new Dt(p.serializer,b)})(e,h.child(o));return this.getDocumentsMatchingPipeline(t,f,r,s).next((m=>{m.forEach(((p,I)=>{a=a.insert(p,I)}))}))})).next((()=>a))))}{let o;return this.getOverlaysForPipeline(t,e,r.largestBatchId).next((a=>{switch(o=a,ve(e)){case"collection":return this.remoteDocumentCache.getDocumentsMatchingQuery(t,e,r,o,s);case"documents":let c=G();for(const h of ki(e))c=c.add(F.fromPath(h));return this.remoteDocumentCache.getEntries(t,c);case"database":return this.remoteDocumentCache.getAllEntries(t);default:throw new k("invalid-argument",`Invalid pipeline source to execute offline: ${ae(e)}`)}})).next((a=>this.retrieveMatchingLocalDocuments(o,a,(c=>Fs(e,c)))))}}retrieveMatchingLocalDocuments(t,e,r){t.forEach(((o,a)=>{const c=a.getKey();e.get(c)===null&&(e=e.insert(c,Vt.newInvalidDocument(c)))}));let s=sn();return e.forEach(((o,a)=>{const c=t.get(o);c!==void 0&&Jn(c.mutation,a,Bt.empty(),tt.now()),r(a)&&(s=s.insert(o,a))})),s}getOverlaysForPipeline(t,e,r){switch(ve(e)){case"collection":return this.documentOverlayCache.getOverlaysForCollection(t,Y.fromString(Ls(e)),r);case"collection_group":throw new k("invalid-argument",`Unexpected collection group pipeline: ${ae(e)}`);case"documents":return this.documentOverlayCache.getOverlays(t,ki(e).map((s=>F.fromPath(s))));case"database":return this.documentOverlayCache.getAllOverlays(t,r);default:throw new k("invalid-argument",`Failed to get overlays for pipeline: ${ae(e)}`)}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ng{constructor(t){this.serializer=t,this.Hs=new Map,this.Js=new Map}getBundleMetadata(t,e){return C.resolve(this.Hs.get(e))}saveBundleMetadata(t,e){return this.Hs.set(e.id,(function(s){return{id:s.id,version:s.version,createTime:te(s.createTime)}})(e)),C.resolve()}getNamedQuery(t,e){return C.resolve(this.Js.get(e))}saveNamedQuery(t,e){return this.Js.set(e.name,(function(s){return{name:s.name,query:Vg(s.bundledQuery),readTime:te(s.readTime)}})(e)),C.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kg{constructor(){this.overlays=new et(F.comparator),this.Ys=new Map}getOverlay(t,e){return C.resolve(this.overlays.get(e))}getOverlays(t,e){const r=_e();return C.forEach(e,(s=>this.getOverlay(t,s).next((o=>{o!==null&&r.set(s,o)})))).next((()=>r))}getAllOverlays(t,e){const r=_e();return this.overlays.forEach(((s,o)=>{o.largestBatchId>e&&r.set(s,o)})),C.resolve(r)}saveOverlays(t,e,r){return r.forEach(((s,o)=>{this.Hr(t,e,o)})),C.resolve()}removeOverlaysForBatchId(t,e,r){const s=this.Ys.get(r);return s!==void 0&&(s.forEach((o=>this.overlays=this.overlays.remove(o))),this.Ys.delete(r)),C.resolve()}getOverlaysForCollection(t,e,r){const s=_e(),o=e.length+1,a=new F(e.child("")),c=this.overlays.getIteratorFrom(a);for(;c.hasNext();){const h=c.getNext().value,f=h.getKey();if(!e.isPrefixOf(f.path))break;f.path.length===o&&h.largestBatchId>r&&s.set(h.getKey(),h)}return C.resolve(s)}getOverlaysForCollectionGroup(t,e,r,s){let o=new et(((f,m)=>f-m));const a=this.overlays.getIterator();for(;a.hasNext();){const f=a.getNext().value;if(f.getKey().getCollectionGroup()===e&&f.largestBatchId>r){let m=o.get(f.largestBatchId);m===null&&(m=_e(),o=o.insert(f.largestBatchId,m)),m.set(f.getKey(),f)}}const c=_e(),h=o.getIterator();for(;h.hasNext()&&(h.getNext().value.forEach(((f,m)=>c.set(f,m))),!(c.size()>=s)););return C.resolve(c)}Hr(t,e,r){const s=this.overlays.get(r.key);if(s!==null){const a=this.Ys.get(s.largestBatchId).delete(r.key);this.Ys.set(s.largestBatchId,a)}this.overlays=this.overlays.insert(r.key,new Ig(e,r));let o=this.Ys.get(e);o===void 0&&(o=G(),this.Ys.set(e,o)),this.Ys.set(e,o.add(r.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Og{constructor(){this.sessionToken=lt.EMPTY_BYTE_STRING}getSessionToken(t){return C.resolve(this.sessionToken)}setSessionToken(t,e){return this.sessionToken=e,C.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vo{constructor(){this.Zs=new ct(gt.Xs),this.e_=new ct(gt.t_)}isEmpty(){return this.Zs.isEmpty()}addReference(t,e){const r=new gt(t,e);this.Zs=this.Zs.add(r),this.e_=this.e_.add(r)}n_(t,e){t.forEach((r=>this.addReference(r,e)))}removeReference(t,e){this.r_(new gt(t,e))}i_(t,e){t.forEach((r=>this.removeReference(r,e)))}s_(t){const e=new F(new Y([])),r=new gt(e,t),s=new gt(e,t+1),o=[];return this.e_.forEachInRange([r,s],(a=>{this.r_(a),o.push(a.key)})),o}__(){this.Zs.forEach((t=>this.r_(t)))}r_(t){this.Zs=this.Zs.delete(t),this.e_=this.e_.delete(t)}o_(t){const e=new F(new Y([])),r=new gt(e,t),s=new gt(e,t+1);let o=G();return this.e_.forEachInRange([r,s],(a=>{o=o.add(a.key)})),o}containsKey(t){const e=new gt(t,0),r=this.Zs.firstAfterOrEqual(e);return r!==null&&t.isEqual(r.key)}}class gt{constructor(t,e){this.key=t,this.a_=e}static Xs(t,e){return F.comparator(t.key,e.key)||H(t.a_,e.a_)}static t_(t,e){return H(t.a_,e.a_)||F.comparator(t.key,e.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lg{constructor(t,e){this.indexManager=t,this.referenceDelegate=e,this.mutationQueue=[],this.gs=1,this.u_=new ct(gt.Xs)}checkEmpty(t){return C.resolve(this.mutationQueue.length===0)}addMutationBatch(t,e,r,s){const o=this.gs;this.gs++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const a=new wg(o,e,r,s);this.mutationQueue.push(a);for(const c of s)this.u_=this.u_.add(new gt(c.key,o)),this.indexManager.addToCollectionParentIndex(t,c.key.path.popLast());return C.resolve(a)}lookupMutationBatch(t,e){return C.resolve(this.c_(e))}getNextMutationBatchAfterBatchId(t,e){const r=e+1,s=this.l_(r),o=s<0?0:s;return C.resolve(this.mutationQueue.length>o?this.mutationQueue[o]:null)}getHighestUnacknowledgedBatchId(){return C.resolve(this.mutationQueue.length===0?Hi:this.gs-1)}getAllMutationBatches(t){return C.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(t,e){const r=new gt(e,0),s=new gt(e,Number.POSITIVE_INFINITY),o=[];return this.u_.forEachInRange([r,s],(a=>{const c=this.c_(a.a_);o.push(c)})),C.resolve(o)}getAllMutationBatchesAffectingDocumentKeys(t,e){let r=new ct(H);return e.forEach((s=>{const o=new gt(s,0),a=new gt(s,Number.POSITIVE_INFINITY);this.u_.forEachInRange([o,a],(c=>{r=r.add(c.a_)}))})),C.resolve(this.E_(r))}getAllMutationBatchesAffectingQuery(t,e){const r=e.path,s=r.length+1;let o=r;F.isDocumentKey(o)||(o=o.child(""));const a=new gt(new F(o),0);let c=new ct(H);return this.u_.forEachWhile((h=>{const f=h.key.path;return!!r.isPrefixOf(f)&&(f.length===s&&(c=c.add(h.a_)),!0)}),a),C.resolve(this.E_(c))}E_(t){const e=[];return t.forEach((r=>{const s=this.c_(r);s!==null&&e.push(s)})),e}removeMutationBatch(t,e){M(this.h_(e.batchId,"removed")===0,55003),this.mutationQueue.shift();let r=this.u_;return C.forEach(e.mutations,(s=>{const o=new gt(s.key,e.batchId);return r=r.delete(o),this.referenceDelegate.markPotentiallyOrphaned(t,s.key)})).next((()=>{this.u_=r}))}bs(t){}containsKey(t,e){const r=new gt(e,0),s=this.u_.firstAfterOrEqual(r);return C.resolve(e.isEqual(s&&s.key))}performConsistencyCheck(t){return this.mutationQueue.length,C.resolve()}h_(t,e){return this.l_(t)}l_(t){return this.mutationQueue.length===0?0:t-this.mutationQueue[0].batchId}c_(t){const e=this.l_(t);return e<0||e>=this.mutationQueue.length?null:this.mutationQueue[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mg{constructor(t){this.T_=t,this.docs=(function(){return new et(F.comparator)})(),this.size=0}setIndexManager(t){this.indexManager=t}addEntry(t,e){const r=e.key,s=this.docs.get(r),o=s?s.size:0,a=this.T_(e);return this.docs=this.docs.insert(r,{document:e.mutableCopy(),size:a}),this.size+=a-o,this.indexManager.addToCollectionParentIndex(t,r.path.popLast())}removeEntry(t){const e=this.docs.get(t);e&&(this.docs=this.docs.remove(t),this.size-=e.size)}getEntry(t,e){const r=this.docs.get(e);return C.resolve(r?r.document.mutableCopy():Vt.newInvalidDocument(e))}getEntries(t,e){let r=Nt();return e.forEach((s=>{const o=this.docs.get(s);r=r.insert(s,o?o.document.mutableCopy():Vt.newInvalidDocument(s))})),C.resolve(r)}getAllEntries(t){let e=Nt();return this.docs.forEach(((r,s)=>{e=e.insert(r,s.document)})),C.resolve(e)}getDocumentsMatchingQuery(t,e,r,s){let o,a;mt(e)?(o=Y.fromString(Ls(e)),a=m=>Fs(e,m)):(o=e.path,a=m=>Cs(e,m));let c=Nt();const h=new F(o.child("__id-9223372036854775808__")),f=this.docs.getIteratorFrom(h);for(;f.hasNext();){const{key:m,value:{document:p}}=f.getNext();if(!o.isPrefixOf(m.path))break;m.path.length>o.length+1||fd(hd(p),r)<=0||(s.has(p.key)||a(p))&&(c=c.insert(p.key,p.mutableCopy()))}return C.resolve(c)}getAllFromCollectionGroup(t,e,r,s){B(9500)}P_(t,e){return C.forEach(this.docs,(r=>e(r)))}newChangeBuffer(t){return new Ug(this)}getSize(t){return C.resolve(this.size)}}class Ug extends bg{constructor(t){super(),this.zs=t}applyChanges(t){const e=[];return this.changes.forEach(((r,s)=>{s.isValidDocument()?e.push(this.zs.addEntry(t,s)):this.zs.removeEntry(r)})),C.waitFor(e)}getFromCache(t,e){return this.zs.getEntry(t,e)}getAllFromCache(t,e){return this.zs.getEntries(t,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fg{constructor(t){this.persistence=t,this.R_=new Ye((e=>wl(e)),Il),this.lastRemoteSnapshotVersion=$.min(),this.highestTargetId=0,this.I_=0,this.A_=new vo,this.targetCount=0,this.V_=xe.xs()}forEachTarget(t,e){return this.R_.forEach(((r,s)=>e(s))),C.resolve()}getLastRemoteSnapshotVersion(t){return C.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(t){return C.resolve(this.I_)}allocateTargetId(t){return this.highestTargetId=this.V_.next(),C.resolve(this.highestTargetId)}setTargetsMetadata(t,e,r){return r&&(this.lastRemoteSnapshotVersion=r),e>this.I_&&(this.I_=e),C.resolve()}Ms(t){this.R_.set(t.target,t);const e=t.targetId;e>this.highestTargetId&&(this.V_=new xe(e),this.highestTargetId=e),t.sequenceNumber>this.I_&&(this.I_=t.sequenceNumber)}addTargetData(t,e){return this.Ms(e),this.targetCount+=1,C.resolve()}updateTargetData(t,e){return this.Ms(e),C.resolve()}removeTargetData(t,e){return this.R_.delete(e.target),this.A_.s_(e.targetId),this.targetCount-=1,C.resolve()}removeTargets(t,e,r){let s=0;const o=[];return this.R_.forEach(((a,c)=>{c.sequenceNumber<=e&&r.get(c.targetId)===null&&(this.R_.delete(a),o.push(this.removeMatchingKeysForTargetId(t,c.targetId)),s++)})),C.waitFor(o).next((()=>s))}getTargetCount(t){return C.resolve(this.targetCount)}getTargetData(t,e){const r=this.R_.get(e)||null;return C.resolve(r)}addMatchingKeys(t,e,r){return this.A_.n_(e,r),C.resolve()}removeMatchingKeys(t,e,r){this.A_.i_(e,r);const s=this.persistence.referenceDelegate,o=[];return s&&e.forEach((a=>{o.push(s.markPotentiallyOrphaned(t,a))})),C.waitFor(o)}removeMatchingKeysForTargetId(t,e){return this.A_.s_(e),C.resolve()}getMatchingKeysForTargetId(t,e){const r=this.A_.o_(e);return C.resolve(r)}containsKey(t,e){return C.resolve(this.A_.containsKey(e))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vl{constructor(t,e){this.d_={},this.overlays={},this.f_=new Is(0),this.m_=!1,this.m_=!0,this.p_=new Og,this.referenceDelegate=t(this),this.g_=new Fg(this),this.indexManager=new Rg,this.remoteDocumentCache=(function(s){return new Mg(s)})((r=>this.referenceDelegate.y_(r))),this.serializer=new Ag(e),this.w_=new Ng(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.m_=!1,Promise.resolve()}get started(){return this.m_}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(t){return this.indexManager}getDocumentOverlayCache(t){let e=this.overlays[t.toKey()];return e||(e=new kg,this.overlays[t.toKey()]=e),e}getMutationQueue(t,e){let r=this.d_[t.toKey()];return r||(r=new Lg(e,this.referenceDelegate),this.d_[t.toKey()]=r),r}getGlobalsCache(){return this.p_}getTargetCache(){return this.g_}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.w_}runTransaction(t,e,r){O("MemoryPersistence","Starting transaction:",t);const s=new Bg(this.f_.next());return this.referenceDelegate.b_(),r(s).next((o=>this.referenceDelegate.v_(s).next((()=>o)))).toPromise().then((o=>(s.raiseOnCommittedEvent(),o)))}S_(t,e){return C.or(Object.values(this.d_).map((r=>()=>r.containsKey(t,e))))}}class Bg extends md{constructor(t){super(),this.currentSequenceNumber=t}}class wo{constructor(t){this.persistence=t,this.D_=new vo,this.x_=null}static C_(t){return new wo(t)}get F_(){if(this.x_)return this.x_;throw B(60996)}addReference(t,e,r){return this.D_.addReference(r,e),this.F_.delete(r.toString()),C.resolve()}removeReference(t,e,r){return this.D_.removeReference(r,e),this.F_.add(r.toString()),C.resolve()}markPotentiallyOrphaned(t,e){return this.F_.add(e.toString()),C.resolve()}removeTarget(t,e){this.D_.s_(e.targetId).forEach((s=>this.F_.add(s.toString())));const r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(t,e.targetId).next((s=>{s.forEach((o=>this.F_.add(o.toString())))})).next((()=>r.removeTargetData(t,e)))}b_(){this.x_=new Set}v_(t){const e=this.persistence.getRemoteDocumentCache().newChangeBuffer();return C.forEach(this.F_,(r=>{const s=F.fromPath(r);return this.O_(t,s).next((o=>{o||e.removeEntry(s,$.min())}))})).next((()=>(this.x_=null,e.apply(t))))}updateLimboDocument(t,e){return this.O_(t,e).next((r=>{r?this.F_.delete(e.toString()):this.F_.add(e.toString())}))}y_(t){return 0}O_(t,e){return C.or([()=>C.resolve(this.D_.containsKey(e)),()=>this.persistence.getTargetCache().containsKey(t,e),()=>this.persistence.S_(t,e)])}}class Es{constructor(t,e){this.persistence=t,this.M_=new Ye((r=>yd(r.path)),((r,s)=>r.isEqual(s))),this.garbageCollector=Um(this,e)}static C_(t,e){return new Es(t,e)}b_(){}v_(t){return C.resolve()}forEachTarget(t,e){return this.persistence.getTargetCache().forEachTarget(t,e)}lr(t){const e=this.Ls(t);return this.persistence.getTargetCache().getTargetCount(t).next((r=>e.next((s=>r+s))))}Ls(t){let e=0;return this.Er(t,(r=>{e++})).next((()=>e))}Er(t,e){return C.forEach(this.M_,((r,s)=>this.Us(t,r,s).next((o=>o?C.resolve():e(s)))))}removeTargets(t,e,r){return this.persistence.getTargetCache().removeTargets(t,e,r)}removeOrphanedDocuments(t,e){let r=0;const s=this.persistence.getRemoteDocumentCache(),o=s.newChangeBuffer();return s.P_(t,(a=>this.Us(t,a,e).next((c=>{c||(r++,o.removeEntry(a,$.min()))})))).next((()=>o.apply(t))).next((()=>r))}markPotentiallyOrphaned(t,e){return this.M_.set(e,t.currentSequenceNumber),C.resolve()}removeTarget(t,e){const r=e.withSequenceNumber(t.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(t,r)}addReference(t,e,r){return this.M_.set(r,t.currentSequenceNumber),C.resolve()}removeReference(t,e,r){return this.M_.set(r,t.currentSequenceNumber),C.resolve()}updateLimboDocument(t,e){return this.M_.set(e,t.currentSequenceNumber),C.resolve()}y_(t){let e=t.key.toString().length;return t.isFoundDocument()&&(e+=es(t.data.value)),e}Us(t,e,r){return C.or([()=>this.persistence.S_(t,e),()=>this.persistence.getTargetCache().containsKey(t,e),()=>{const s=this.M_.get(e);return C.resolve(s!==void 0&&s>r)}])}getCacheSize(t){return this.persistence.getRemoteDocumentCache().getSize(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Io{constructor(t,e,r,s){this.targetId=t,this.fromCache=e,this.wo=r,this.bo=s}static vo(t,e){let r=G(),s=G();for(const o of e.docChanges)switch(o.type){case 0:r=r.add(o.doc.key);break;case 1:s=s.add(o.doc.key)}return new Io(t,e.fromCache,r,s)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qg(n,t){return F.comparator(n.key,t.key)}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $g{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(t){this._documentReadCount+=t}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jg{constructor(){this.So=!1,this.Do=!1,this.xo=100,this.Co=(function(){return $h()?8:pd(Bh())>0?6:4})()}initialize(t,e){this.Fo=t,this.indexManager=e,this.So=!0}getDocumentsMatchingQuery(t,e,r,s){const o={result:null};return this.Oo(t,e).next((a=>{o.result=a})).next((()=>{if(!o.result)return this.Mo(t,e,s,r).next((a=>{o.result=a}))})).next((()=>{if(o.result)return;const a=new $g;return this.No(t,e,a).next((c=>{if(o.result=c,this.Do)return this.Lo(t,e,a,c.size)}))})).next((()=>o.result))}Lo(t,e,r,s){return mt(e)?C.resolve():r.documentReadCount<this.xo?(rn()<=W.DEBUG&&O("QueryEngine","SDK will not create cache indexes for query:",Zn(e),"since it only creates cache indexes for collection contains","more than or equal to",this.xo,"documents"),C.resolve()):(rn()<=W.DEBUG&&O("QueryEngine","Query:",Zn(e),"scans",r.documentReadCount,"local documents and returns",s,"documents as results."),r.documentReadCount>this.Co*s?(rn()<=W.DEBUG&&O("QueryEngine","The SDK decides to create cache indexes for query:",Zn(e),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(t,Zt(e))):C.resolve())}Oo(t,e){if(mt(e))return C.resolve(null);let r=e;if(hu(r))return C.resolve(null);let s=Zt(r);return this.indexManager.getIndexType(t,s).next((o=>o===0?null:(r.limit!==null&&o===1&&(r=Ci(r,null,"F"),s=Zt(r)),this.indexManager.getDocumentsMatchingTarget(t,s).next((a=>{const c=G(...a);return this.Fo.getDocuments(t,c).next((h=>this.indexManager.getMinOffset(t,s).next((f=>{const m=this.Bo(r,h);return this.Uo(r,m,c,f.readTime)?this.Oo(t,Ci(r,null,"F")):this.ko(t,m,r,f)}))))})))))}Mo(t,e,r,s){return(mt(e)?(function(a){for(const c of a.stages){if(c instanceof yr||c instanceof Ru)return!1;if(c instanceof co){if(c.condition instanceof cl&&c.condition._expr.name==="exists"&&c.condition._expr.params[0]instanceof Cr&&c.condition._expr.params[0].fieldName===fn)continue;return!1}}return!0})(e):hu(e))||s.isEqual($.min())?C.resolve(null):this.Fo.getDocuments(t,r).next((o=>{const a=this.Bo(e,o);return this.Uo(e,a,r,s)?C.resolve(null):(rn()<=W.DEBUG&&O("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),Pu(e)),this.ko(t,a,e,ld(s,or)).next((c=>c)))}))}Bo(t,e){let r,s;return mt(t)?(r=new ct(qg),s=o=>Fs(t,o)):(r=new ct(Xi(t)),s=o=>Cs(t,o)),e.forEach(((o,a)=>{s(a)&&(r=r.add(a))})),r}Uo(t,e,r,s){if(mt(t))return(function(c){return c.stages.some((h=>h instanceof yr||h instanceof Ru))})(t);if(t.limit===null)return!1;if(r.size!==e.size)return!0;const o=t.limitType==="F"?e.last():e.first();return!!o&&(o.hasPendingWrites||o.version.compareTo(s)>0)}No(t,e,r){return rn()<=W.DEBUG&&O("QueryEngine","Using full collection scan to execute query:",Pu(e)),this.Fo.getDocumentsMatchingQuery(t,e,Ae.min(),r)}ko(t,e,r,s){return this.Fo.getDocumentsMatchingQuery(t,r,s).next((o=>(e.forEach((a=>{o=o.insert(a.key,a)})),o)))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ao="LocalStore",zg=3e8;class Gg{constructor(t,e,r,s){this.persistence=t,this.qo=e,this.serializer=s,this.$o=new et(H),this.Ko=new Ye((o=>wl(o)),Il),this.Wo=new Map,this.Qo=t.getRemoteDocumentCache(),this.g_=t.getTargetCache(),this.w_=t.getBundleCache(),this.Go(r)}Go(t){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(t),this.indexManager=this.persistence.getIndexManager(t),this.mutationQueue=this.persistence.getMutationQueue(t,this.indexManager),this.localDocuments=new Dg(this.Qo,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Qo.setIndexManager(this.indexManager),this.qo.initialize(this.localDocuments,this.indexManager)}collectGarbage(t){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(e=>t.collect(e,this.$o)))}}function Hg(n,t,e,r){return new Gg(n,t,e,r)}async function Rl(n,t){const e=j(n);return await e.persistence.runTransaction("Handle user change","readonly",(r=>{let s;return e.mutationQueue.getAllMutationBatches(r).next((o=>(s=o,e.Go(t),e.mutationQueue.getAllMutationBatches(r)))).next((o=>{const a=[],c=[];let h=G();for(const f of s){a.push(f.batchId);for(const m of f.mutations)h=h.add(m.key)}for(const f of o){c.push(f.batchId);for(const m of f.mutations)h=h.add(m.key)}return e.localDocuments.getDocuments(r,h).next((f=>({zo:f,removedBatchIds:a,addedBatchIds:c})))}))}))}function Qg(n,t){const e=j(n);return e.persistence.runTransaction("Acknowledge batch","readwrite-primary",(r=>{const s=t.batch.keys(),o=e.Qo.newChangeBuffer({trackRemovals:!0});return(function(c,h,f,m){const p=f.batch,I=p.keys();let b=C.resolve();return I.forEach((x=>{b=b.next((()=>m.getEntry(h,x))).next((U=>{const L=f.docVersions.get(x);M(L!==null,48541),U.version.compareTo(L)<0&&(p.applyToRemoteDocument(U,f),U.isValidDocument()&&(U.setReadTime(f.commitVersion),m.addEntry(U)))}))})),b.next((()=>c.mutationQueue.removeMutationBatch(h,p)))})(e,r,t,o).next((()=>o.apply(r))).next((()=>e.mutationQueue.performConsistencyCheck(r))).next((()=>e.documentOverlayCache.removeOverlaysForBatchId(r,s,t.batch.batchId))).next((()=>e.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(r,(function(c){let h=G();for(let f=0;f<c.mutationResults.length;++f)c.mutationResults[f].transformResults.length>0&&(h=h.add(c.batch.mutations[f].key));return h})(t)))).next((()=>e.localDocuments.getDocuments(r,s)))}))}function Pl(n){const t=j(n);return t.persistence.runTransaction("Get last remote snapshot version","readonly",(e=>t.g_.getLastRemoteSnapshotVersion(e)))}function Kg(n,t){const e=j(n),r=t.snapshotVersion;let s=e.$o;return e.persistence.runTransaction("Apply remote event","readwrite-primary",(o=>{const a=e.Qo.newChangeBuffer({trackRemovals:!0});s=e.$o;const c=[];t.targetChanges.forEach(((m,p)=>{const I=s.get(p);if(!I)return;c.push(e.g_.removeMatchingKeys(o,m.removedDocuments,p).next((()=>e.g_.addMatchingKeys(o,m.addedDocuments,p))));let b=I.withSequenceNumber(o.currentSequenceNumber);t.targetMismatches.get(p)!==null?b=b.withResumeToken(lt.EMPTY_BYTE_STRING,$.min()).withLastLimboFreeSnapshotVersion($.min()):m.resumeToken.approximateByteSize()>0&&(b=b.withResumeToken(m.resumeToken,r)),s=s.insert(p,b),(function(U,L,Q){return U.resumeToken.approximateByteSize()===0||L.snapshotVersion.toMicroseconds()-U.snapshotVersion.toMicroseconds()>=zg?!0:Q.addedDocuments.size+Q.modifiedDocuments.size+Q.removedDocuments.size>0})(I,b,m)&&c.push(e.g_.updateTargetData(o,b))}));let h=Nt(),f=G();if(t.documentUpdates.forEach((m=>{t.resolvedLimboDocuments.has(m)&&c.push(e.persistence.referenceDelegate.updateLimboDocument(o,m))})),c.push(Wg(o,a,t.documentUpdates).next((m=>{h=m.jo,f=m.Ho}))),!r.isEqual($.min())){const m=e.g_.getLastRemoteSnapshotVersion(o).next((p=>e.g_.setTargetsMetadata(o,o.currentSequenceNumber,r)));c.push(m)}return C.waitFor(c).next((()=>a.apply(o))).next((()=>e.localDocuments.getLocalViewOfDocuments(o,h,f))).next((()=>h))})).then((o=>(e.$o=s,o)))}function Wg(n,t,e){let r=G(),s=G();return e.forEach((o=>r=r.add(o))),t.getEntries(n,r).next((o=>{let a=Nt();return e.forEach(((c,h)=>{const f=o.get(c);h.isFoundDocument()!==f.isFoundDocument()&&(s=s.add(c)),h.isNoDocument()&&h.version.isEqual($.min())?(t.removeEntry(c,h.readTime),a=a.insert(c,h)):!f.isValidDocument()||h.version.compareTo(f.version)>0||h.version.compareTo(f.version)===0&&f.hasPendingWrites?(t.addEntry(h),a=a.insert(c,h)):O(Ao,"Ignoring outdated watch update for ",c,". Current version:",f.version," Watch version:",h.version)})),{jo:a,Ho:s}}))}function Yg(n,t){const e=j(n);return e.persistence.runTransaction("Get next mutation batch","readonly",(r=>(t===void 0&&(t=Hi),e.mutationQueue.getNextMutationBatchAfterBatchId(r,t))))}function Jg(n,t){const e=j(n);return e.persistence.runTransaction("Allocate target","readwrite",(r=>{let s;return e.g_.getTargetData(r,t).next((o=>o?(s=o,C.resolve(s)):e.g_.allocateTargetId(r).next((a=>(s=new ie(t,a,"TargetPurposeListen",r.currentSequenceNumber),e.g_.addTargetData(r,s).next((()=>s)))))))})).then((r=>{const s=e.$o.get(r.targetId);return(s===null||r.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(e.$o=e.$o.insert(r.targetId,r),e.Ko.set(t,r.targetId)),r}))}async function Li(n,t,e){const r=j(n),s=r.$o.get(t),o=e?"readwrite":"readwrite-primary";try{e||await r.persistence.runTransaction("Release target",o,(a=>r.persistence.referenceDelegate.removeTarget(a,s)))}catch(a){if(!wn(a))throw a;O(Ao,`Failed to update sequence numbers for target ${t}: ${a}`)}r.$o=r.$o.remove(t),r.Ko.delete(s.target)}function Su(n,t,e){const r=j(n);let s=$.min(),o=G();return r.persistence.runTransaction("Execute query","readwrite",(a=>(function(h,f,m){const p=j(h),I=p.Ko.get(m);return I!==void 0?C.resolve(p.$o.get(I)):p.g_.getTargetData(f,m)})(r,a,mt(t)?t:Zt(t)).next((c=>{if(c)return s=c.lastLimboFreeSnapshotVersion,r.g_.getMatchingKeysForTargetId(a,c.targetId).next((h=>{o=h}))})).next((()=>r.qo.getDocumentsMatchingQuery(a,t,e?s:$.min(),e?o:G()))).next((c=>(Xg(r,c),{documents:c,Jo:o})))))}function Xg(n,t){t.forEach(((e,r)=>{const s=r.key.getCollectionGroup(),o=n.Wo.get(s)||$.min();r.readTime.compareTo(o)>0&&n.Wo.set(s,r.readTime)}))}class Cu{constructor(){this.activeTargetIds=em()}na(t){this.activeTargetIds=this.activeTargetIds.add(t)}ra(t){this.activeTargetIds=this.activeTargetIds.delete(t)}ta(){const t={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(t)}}class Zg{constructor(){this.Ua=new Cu,this.ka={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(t){}updateMutationState(t,e,r){}addLocalQueryTarget(t,e=!0){return e&&this.Ua.na(t),this.ka[t]||"not-current"}updateQueryState(t,e,r){this.ka[t]=e}removeLocalQueryTarget(t){this.Ua.ra(t)}isLocalQueryTarget(t){return this.Ua.activeTargetIds.has(t)}clearQueryState(t){delete this.ka[t]}getAllActiveQueryTargets(){return this.Ua.activeTargetIds}isActiveQueryTarget(t){return this.Ua.activeTargetIds.has(t)}start(){return this.Ua=new Cu,Promise.resolve()}handleUserChange(t,e,r){}setOnlineState(t){}shutdown(){}writeSequenceNumber(t){}notifyBundleLoaded(t){}}function yi(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class t_{constructor(t,e){this.asyncQueue=t,this.onlineStateHandler=e,this.state="Unknown",this.qa=0,this.$a=null,this.Ka=!0}Wa(){this.qa===0&&(this.Qa("Unknown"),this.$a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this.$a=null,this.Ga("Backend didn't respond within 10 seconds."),this.Qa("Offline"),Promise.resolve()))))}za(t){this.state==="Online"?this.Qa("Unknown"):(this.qa++,this.qa>=1&&(this.ja(),this.Ga(`Connection failed 1 times. Most recent error: ${t.toString()}`),this.Qa("Offline")))}set(t){this.ja(),this.qa=0,t==="Online"&&(this.Ka=!1),this.Qa(t)}Qa(t){t!==this.state&&(this.state=t,this.onlineStateHandler(t))}Ga(t){const e=`Could not reach Cloud Firestore backend. ${t}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.Ka?(ce(e),this.Ka=!1):O("OnlineStateTracker",e)}ja(){this.$a!==null&&(this.$a.cancel(),this.$a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const se="RemoteStore";class e_{constructor(t,e,r,s,o){this.localStore=t,this.datastore=e,this.asyncQueue=r,this.remoteSyncer={},this.Ha=[],this.Ja=new Map,this.Ya=new Map,this.Za=new Map,this.Xa=new xe(1e3),this.eu=new xe(1001),this.tu=new Set,this.nu=[],this.ru=o,this.ru.bt((a=>{r.enqueueAndForget((async()=>{Ze(this)&&(O(se,"Restarting streams for network reachability change."),await(async function(h){const f=j(h);f.tu.add(4),await xr(f),f.iu.set("Unknown"),f.tu.delete(4),await Bs(f)})(this))}))})),this.iu=new t_(r,s)}}async function Bs(n){if(Ze(n))for(const t of n.nu)await t(!0)}async function xr(n){for(const t of n.nu)await t(!1)}function Mi(n,t){return n.Ya.get(t)||void 0}function Sl(n,t){const e=j(n),r=Mi(e,t.targetId);if(r!==void 0&&e.Ja.has(r))return;const s=(function(c,h){const f=Mi(c,h);f!==void 0&&c.Za.delete(f);const m=(function(I,b){return b%2!=0?I.eu.next():I.Xa.next()})(c,h);return c.Ya.set(h,m),c.Za.set(m,h),m})(e,t.targetId);O(se,"remoteStoreListen mapping SDK target ID to remote",t.targetId,s);const o=new ie(t.target,s,t.purpose,t.sequenceNumber,t.snapshotVersion,t.lastLimboFreeSnapshotVersion,t.resumeToken);e.Ja.set(s,o),So(e)?Po(e):Pn(e).Fn()&&Ro(e,o)}function Vo(n,t){const e=j(n),r=Pn(e),s=Mi(e,t);O(se,"remoteStoreUnlisten removing mapping of SDK target ID to remote",t,s),e.Ja.delete(s),e.Ya.delete(t),e.Za.delete(s),r.Fn()&&Cl(e,s),e.Ja.size===0&&(r.Fn()?r.Nn():Ze(e)&&e.iu.set("Unknown"))}function Ro(n,t){if(n.su.We(t.targetId),t.resumeToken.approximateByteSize()>0||t.snapshotVersion.compareTo($.min())>0){const e=n.Za.get(t.targetId);if(e===void 0)return void O(se,"SDK target ID not found for remote ID: "+t.targetId);const r=n.remoteSyncer.getRemoteKeysForTarget(e).size;t=t.withExpectedCount(r)}Pn(n).jn(t)}function Cl(n,t){n.su.We(t),Pn(n).Hn(t)}function Po(n){n.su=new sm({getRemoteKeysForTarget:t=>{const e=n.Za.get(t);return e!==void 0?n.remoteSyncer.getRemoteKeysForTarget(e):G()},dt:t=>n.Ja.get(t)||null,Tt:()=>n.datastore.serializer.databaseId}),Pn(n).start(),n.iu.Wa()}function So(n){return Ze(n)&&!Pn(n).Cn()&&n.Ja.size>0}function Ze(n){return j(n).tu.size===0}function bl(n){n.su=void 0}async function n_(n){n.iu.set("Online")}async function r_(n){n.Ja.forEach(((t,e)=>{Ro(n,t)}))}async function s_(n,t){bl(n),So(n)?(n.iu.za(t),Po(n)):n.iu.set("Unknown")}async function i_(n,t,e){if(n.iu.set("Online"),t instanceof Bc&&t.state===2&&t.cause)try{await(async function(s,o){const a=o.cause;for(const c of o.targetIds){if(s.Ja.has(c)){const h=s.Za.get(c);h!==void 0&&(await s.remoteSyncer.rejectListen(h,a),s.Ya.delete(h),s.Za.delete(c)),s.Ja.delete(c)}s.su.removeTarget(c)}})(n,t)}catch(r){O(se,"Failed to remove targets %s: %s ",t.targetIds.join(","),r),await Ts(n,r)}else if(t instanceof rs?n.su.et(t):t instanceof Fc?n.su.ot(t):n.su.rt(t),!e.isEqual($.min()))try{const r=await Pl(n.localStore);e.compareTo(r)>=0&&await(function(o,a){const c=o.su.Rt(a);c.targetChanges.forEach(((f,m)=>{if(f.resumeToken.approximateByteSize()>0){const p=o.Ja.get(m);p&&o.Ja.set(m,p.withResumeToken(f.resumeToken,a))}})),c.targetMismatches.forEach(((f,m)=>{const p=o.Ja.get(f);if(!p)return;o.Ja.set(f,p.withResumeToken(lt.EMPTY_BYTE_STRING,p.snapshotVersion)),Cl(o,f);const I=new ie(p.target,f,m,p.sequenceNumber);Ro(o,I)}));const h=(function(m,p){const I=new Map;p.targetChanges.forEach(((x,U)=>{const L=m.Za.get(U);L!==void 0&&I.set(L,x)}));let b=new et(H);return p.targetMismatches.forEach(((x,U)=>{const L=m.Za.get(x);L!==void 0&&(b=b.insert(L,U))})),new Pr(p.snapshotVersion,I,b,p.documentUpdates,p.augmentedDocumentUpdates,p.resolvedLimboDocuments)})(o,c);return o.remoteSyncer.applyRemoteEvent(h)})(n,e)}catch(r){O(se,"Failed to raise snapshot:",r),await Ts(n,r)}}async function Ts(n,t,e){if(!wn(t))throw t;n.tu.add(1),await xr(n),n.iu.set("Offline"),e||(e=()=>Pl(n.localStore)),n.asyncQueue.enqueueRetryable((async()=>{O(se,"Retrying IndexedDB access"),await e(),n.tu.delete(1),await Bs(n)}))}function xl(n,t){return t().catch((e=>Ts(n,e,t)))}async function qs(n){const t=j(n),e=De(t);let r=t.Ha.length>0?t.Ha[t.Ha.length-1].batchId:Hi;for(;o_(t);)try{const s=await Yg(t.localStore,r);if(s===null){t.Ha.length===0&&e.Nn();break}r=s.batchId,a_(t,s)}catch(s){await Ts(t,s)}Dl(t)&&Nl(t)}function o_(n){return Ze(n)&&n.Ha.length<10}function a_(n,t){n.Ha.push(t);const e=De(n);e.Fn()&&e.Jn&&e.Yn(t.mutations)}function Dl(n){return Ze(n)&&!De(n).Cn()&&n.Ha.length>0}function Nl(n){De(n).start()}async function u_(n){De(n).er()}async function c_(n){const t=De(n);for(const e of n.Ha)t.Yn(e.mutations)}async function l_(n,t,e){const r=n.Ha.shift(),s=To.from(r,t,e);await xl(n,(()=>n.remoteSyncer.applySuccessfulWrite(s))),await qs(n)}async function h_(n,t){t&&De(n).Jn&&await(async function(r,s){if((function(a){return Yd(a)&&a!==S.ABORTED})(s.code)){const o=r.Ha.shift();De(r).Mn(),await xl(r,(()=>r.remoteSyncer.rejectFailedWrite(o.batchId,s))),await qs(r)}})(n,t),Dl(n)&&Nl(n)}async function bu(n,t){const e=j(n);e.asyncQueue.verifyOperationInProgress(),O(se,"RemoteStore received new credentials");const r=Ze(e);e.tu.add(3),await xr(e),r&&e.iu.set("Unknown"),await e.remoteSyncer.handleCredentialChange(t),e.tu.delete(3),await Bs(e)}async function f_(n,t){const e=j(n);t?(e.tu.delete(2),await Bs(e)):t||(e.tu.add(2),await xr(e),e.iu.set("Unknown"))}function Pn(n){return n._u||(n._u=(function(e,r,s){const o=j(e);return o.nr(),new Sm(r,o.connection,o.authCredentials,o.appCheckCredentials,o.serializer,s)})(n.datastore,n.asyncQueue,{Qt:n_.bind(null,n),zt:r_.bind(null,n),Ht:s_.bind(null,n),zn:i_.bind(null,n)}),n.nu.push((async t=>{t?(n._u.Mn(),So(n)?Po(n):n.iu.set("Unknown")):(await n._u.stop(),bl(n))}))),n._u}function De(n){return n.ou||(n.ou=(function(e,r,s){const o=j(e);return o.nr(),new Cm(r,o.connection,o.authCredentials,o.appCheckCredentials,o.serializer,s)})(n.datastore,n.asyncQueue,{Qt:()=>Promise.resolve(),zt:u_.bind(null,n),Ht:h_.bind(null,n),Zn:c_.bind(null,n),Xn:l_.bind(null,n)}),n.nu.push((async t=>{t?(n.ou.Mn(),await qs(n)):(await n.ou.stop(),n.Ha.length>0&&(O(se,`Stopping write stream with ${n.Ha.length} pending writes`),n.Ha=[]))}))),n.ou}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Co{constructor(t,e,r,s,o){this.asyncQueue=t,this.timerId=e,this.targetTimeMs=r,this.op=s,this.removalCallback=o,this.deferred=new Ge,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((a=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(t,e,r,s,o){const a=Date.now()+r,c=new Co(t,e,a,s,o);return c.start(r),c}start(t){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),t)}skipDelay(){return this.handleDelayElapsed()}cancel(t){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new k(S.CANCELLED,"Operation cancelled"+(t?": "+t:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((t=>this.deferred.resolve(t)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function bo(n,t){if(ce("AsyncQueue",`${t}: ${n}`),wn(n))return new k(S.UNAVAILABLE,`${t}: ${n}`);throw n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qe{static emptySet(t){return new Qe(t.comparator)}constructor(t){this.comparator=t?(e,r)=>t(e,r)||F.comparator(e.key,r.key):(e,r)=>F.comparator(e.key,r.key),this.keyedMap=sn(),this.sortedSet=new et(this.comparator)}has(t){return this.keyedMap.get(t)!=null}get(t){return this.keyedMap.get(t)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(t){const e=this.keyedMap.get(t);return e?this.sortedSet.indexOf(e):-1}get size(){return this.sortedSet.size}forEach(t){this.sortedSet.inorderTraversal(((e,r)=>(t(e),!1)))}add(t){const e=this.delete(t.key);return e.copy(e.keyedMap.insert(t.key,t),e.sortedSet.insert(t,null))}delete(t){const e=this.get(t);return e?this.copy(this.keyedMap.remove(t),this.sortedSet.remove(e)):this}isEqual(t){if(!(t instanceof Qe)||this.size!==t.size)return!1;const e=this.sortedSet.getIterator(),r=t.sortedSet.getIterator();for(;e.hasNext();){const s=e.getNext().key,o=r.getNext().key;if(!s.isEqual(o))return!1}return!0}toString(){const t=[];return this.forEach((e=>{t.push(e.toString())})),t.length===0?"DocumentSet ()":`DocumentSet (
  `+t.join(`  
`)+`
)`}copy(t,e){const r=new Qe;return r.comparator=this.comparator,r.keyedMap=t,r.sortedSet=e,r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xu{constructor(){this.au=new et(F.comparator)}track(t){const e=t.doc.key,r=this.au.get(e);r?t.type!==0&&r.type===3?this.au=this.au.insert(e,t):t.type===3&&r.type!==1?this.au=this.au.insert(e,{type:r.type,doc:t.doc}):t.type===2&&r.type===2?this.au=this.au.insert(e,{type:2,doc:t.doc}):t.type===2&&r.type===0?this.au=this.au.insert(e,{type:0,doc:t.doc}):t.type===1&&r.type===0?this.au=this.au.remove(e):t.type===1&&r.type===2?this.au=this.au.insert(e,{type:1,doc:r.doc}):t.type===0&&r.type===1?this.au=this.au.insert(e,{type:2,doc:t.doc}):B(63341,{ft:t,uu:r}):this.au=this.au.insert(e,t)}cu(){const t=[];return this.au.inorderTraversal(((e,r)=>{t.push(r)})),t}}class _n{constructor(t,e,r,s,o,a,c,h,f){this.query=t,this.docs=e,this.oldDocs=r,this.docChanges=s,this.mutatedKeys=o,this.fromCache=a,this.syncStateChanged=c,this.excludesMetadataChanges=h,this.hasCachedResults=f}static fromInitialDocuments(t,e,r,s,o){const a=[];return e.forEach((c=>{a.push({type:0,doc:c})})),new _n(t,e,Qe.emptySet(e),a,r,s,!0,!1,o)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(t){if(!(this.fromCache===t.fromCache&&this.hasCachedResults===t.hasCachedResults&&this.syncStateChanged===t.syncStateChanged&&this.mutatedKeys.isEqual(t.mutatedKeys)&&Us(this.query,t.query)&&this.docs.isEqual(t.docs)&&this.oldDocs.isEqual(t.oldDocs)))return!1;const e=this.docChanges,r=t.docChanges;if(e.length!==r.length)return!1;for(let s=0;s<e.length;s++)if(e[s].type!==r[s].type||!e[s].doc.isEqual(r[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class d_{constructor(){this.lu=void 0,this.Eu=[]}hu(){return this.Eu.some((t=>t.Tu()))}}class m_{constructor(){this.queries=Du(),this.onlineState="Unknown",this.Pu=new Set}terminate(){(function(e,r){const s=j(e),o=s.queries;s.queries=Du(),o.forEach(((a,c)=>{for(const h of c.Eu)h.onError(r)}))})(this,new k(S.ABORTED,"Firestore shutting down"))}}function Du(){return new Ye((n=>vl(n)),Us)}async function p_(n,t){const e=j(n);let r=3;const s=t.query;let o=e.queries.get(s);o?!o.hu()&&t.Tu()&&(r=2):(o=new d_,r=t.Tu()?0:1);try{switch(r){case 0:o.lu=await e.onListen(s,!0);break;case 1:o.lu=await e.onListen(s,!1);break;case 2:await e.onFirstRemoteStoreListen(s)}}catch(a){const c=bo(a,`Initialization of query '${mt(t.query)?ae(t.query):Zn(t.query)}' failed`);return void t.onError(c)}e.queries.set(s,o),o.Eu.push(t),t.Ru(e.onlineState),o.lu&&t.Iu(o.lu)&&xo(e)}async function g_(n,t){const e=j(n),r=t.query;let s=3;const o=e.queries.get(r);if(o){const a=o.Eu.indexOf(t);a>=0&&(o.Eu.splice(a,1),o.Eu.length===0?s=t.Tu()?0:1:!o.hu()&&t.Tu()&&(s=2))}switch(s){case 0:return e.queries.delete(r),e.onUnlisten(r,!0);case 1:return e.queries.delete(r),e.onUnlisten(r,!1);case 2:return e.onLastRemoteStoreUnlisten(r);default:return}}function __(n,t){const e=j(n);let r=!1;for(const s of t){const o=s.query,a=e.queries.get(o);if(a){for(const c of a.Eu)c.Iu(s)&&(r=!0);a.lu=s}}r&&xo(e)}function y_(n,t,e){const r=j(n),s=r.queries.get(t);if(s)for(const o of s.Eu)o.onError(e);r.queries.delete(t)}function xo(n){n.Pu.forEach((t=>{t.next()}))}var Ui;(function(n){n.Default="default",n.Cache="cache"})(Ui||(Ui={}));class E_{constructor(t,e,r){this.query=t,this.Au=e,this.Vu=!1,this.du=null,this.onlineState="Unknown",this.options=r||{}}Iu(t){if(!this.options.includeMetadataChanges){const r=[];for(const s of t.docChanges)s.type!==3&&r.push(s);t=new _n(t.query,t.docs,t.oldDocs,r,t.mutatedKeys,t.fromCache,t.syncStateChanged,!0,t.hasCachedResults)}let e=!1;return this.Vu?this.fu(t)&&(this.Au.next(t),e=!0):this.mu(t,this.onlineState)&&(this.pu(t),e=!0),this.du=t,e}onError(t){this.Au.error(t)}Ru(t){this.onlineState=t;let e=!1;return this.du&&!this.Vu&&this.mu(this.du,t)&&(this.pu(this.du),e=!0),e}mu(t,e){if(!t.fromCache||!this.Tu())return!0;const r=e!=="Offline";return(!this.options.waitForSyncWhenOnline||!r)&&(!t.docs.isEmpty()||t.hasCachedResults||e==="Offline")}fu(t){if(t.docChanges.length>0)return!0;const e=this.du&&this.du.hasPendingWrites!==t.hasPendingWrites;return!(!t.syncStateChanged&&!e)&&this.options.includeMetadataChanges===!0}pu(t){t=_n.fromInitialDocuments(t.query,t.docs,t.mutatedKeys,t.fromCache,t.hasCachedResults),this.Vu=!0,this.Au.next(t)}Tu(){return this.options.source!==Ui.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kl{constructor(t){this.key=t}}class Ol{constructor(t){this.key=t}}class T_{constructor(t,e){this.query=t,this.Ou=e,this.Mu=null,this.hasCachedResults=!1,this.current=!1,this.Nu=G(),this.mutatedKeys=G(),this.Lu=mt(t)?Oi(t):Xi(t),this.Bu=new Qe(this.Lu)}get Uu(){return this.Ou}ku(t,e){const r=e?e.qu:new xu,s=e?e.Bu:this.Bu;let o=e?e.mutatedKeys:this.mutatedKeys,a=s,c=!1;const[h,f]=this.$u(this.query,s);t.inorderTraversal(((p,I)=>{const b=s.get(p),x=Sg(this.query,I)?I:null,U=!!b&&this.mutatedKeys.has(b.key),L=!!x&&(x.hasLocalMutations||this.mutatedKeys.has(x.key)&&x.hasCommittedMutations);let Q=!1;b&&x?b.data.isEqual(x.data)?U!==L&&(r.track({type:3,doc:x}),Q=!0):this.Ku(b,x)||(r.track({type:2,doc:x}),Q=!0,(h&&this.Lu(x,h)>0||f&&this.Lu(x,f)<0)&&(c=!0)):!b&&x?(r.track({type:0,doc:x}),Q=!0):b&&!x&&(r.track({type:1,doc:b}),Q=!0,(h||f)&&(c=!0)),Q&&(x?(a=a.add(x),o=L?o.add(p):o.delete(p)):(a=a.delete(p),o=o.delete(p)))}));const m=this.Wu(this.query);if(m)if(mt(this.query)){const p=[];a.forEach((x=>p.push(x)));const I=Al(this.query,p);let b=new Qe(Oi(this.query));for(const x of I)b=b.add(x);a.forEach((x=>{b.has(x.key)||(o=o.delete(x.key),r.track({type:1,doc:x}))})),a=b}else{const p=this.Qu(this.query);for(;a.size>m;){const I=p==="F"?a.last():a.first();a=a.delete(I.key),o=o.delete(I.key),r.track({type:1,doc:I})}}return{Bu:a,qu:r,Uo:c,mutatedKeys:o}}Wu(t){var e;return mt(t)?(e=_i(t))==null?void 0:e.limit:t.limit||void 0}Qu(t){if(mt(t)){const e=_i(t);return e&&e.limit<0?"L":"F"}return t.limitType}$u(t,e){var r;if(mt(t)){const s=(r=_i(t))==null?void 0:r.limit;return[e.size===s?e.last():null,null]}return[t.limitType==="F"&&e.size===this.Wu(this.query)?e.last():null,t.limitType==="L"&&e.size===this.Wu(this.query)?e.first():null]}Ku(t,e){return t.hasLocalMutations&&e.hasCommittedMutations&&!e.hasLocalMutations}applyChanges(t,e,r,s){const o=this.Bu;this.Bu=t.Bu,this.mutatedKeys=t.mutatedKeys;const a=t.qu.cu();a.sort(((m,p)=>(function(b,x){const U=L=>{switch(L){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return B(20277,{ft:L})}};return U(b)-U(x)})(m.type,p.type)||this.Lu(m.doc,p.doc))),this.Gu(r),s=s??!1;const c=e&&!s?this.zu():[],h=this.Nu.size===0&&this.current&&!s?1:0,f=h!==this.Mu;return this.Mu=h,a.length!==0||f?{snapshot:new _n(this.query,t.Bu,o,a,t.mutatedKeys,h===0,f,!1,!!r&&r.resumeToken.approximateByteSize()>0),ju:c}:{ju:c}}Ru(t){return this.current&&t==="Offline"?(this.current=!1,this.applyChanges({Bu:this.Bu,qu:new xu,mutatedKeys:this.mutatedKeys,Uo:!1},!1)):{ju:[]}}Hu(t){return!this.Ou.has(t)&&!!this.Bu.has(t)&&!this.Bu.get(t).hasLocalMutations}Gu(t){t&&(t.addedDocuments.forEach((e=>this.Ou=this.Ou.add(e))),t.modifiedDocuments.forEach((e=>{})),t.removedDocuments.forEach((e=>this.Ou=this.Ou.delete(e))),this.current=t.current)}zu(){if(!this.current)return[];const t=this.Nu;this.Nu=G(),this.Bu.forEach((r=>{this.Hu(r.key)&&(this.Nu=this.Nu.add(r.key))}));const e=[];return t.forEach((r=>{this.Nu.has(r)||e.push(new Ol(r))})),this.Nu.forEach((r=>{t.has(r)||e.push(new kl(r))})),e}Ju(t){this.Ou=t.Jo,this.Nu=G();const e=this.ku(t.documents);return this.applyChanges(e,!0)}Yu(){return _n.fromInitialDocuments(this.query,this.Bu,this.mutatedKeys,this.Mu===0,this.hasCachedResults)}}const Do="SyncEngine";class v_{constructor(t,e,r){this.query=t,this.targetId=e,this.view=r}}class w_{constructor(t){this.key=t,this.Zu=!1}}class I_{constructor(t,e,r,s,o,a){this.localStore=t,this.remoteStore=e,this.eventManager=r,this.sharedClientState=s,this.currentUser=o,this.maxConcurrentLimboResolutions=a,this.Xu={},this.ec=new Ye((c=>vl(c)),Us),this.tc=new Map,this.nc=new Set,this.rc=new et(F.comparator),this.sc=new Map,this._c=new vo,this.oc={},this.ac=new Map,this.uc=xe.Cs(),this.onlineState="Unknown",this.cc=void 0}get isPrimaryClient(){return this.cc===!0}}async function A_(n,t,e=!0){const r=ql(n);let s;const o=r.ec.get(t);return o?(r.sharedClientState.addLocalQueryTarget(o.targetId),s=o.view.Yu()):s=await Ll(r,t,e,!0),s}async function V_(n,t){const e=ql(n);await Ll(e,t,!0,!1)}async function Ll(n,t,e,r){const s=await Jg(n.localStore,mt(t)?t:Zt(t)),o=s.targetId,a=n.sharedClientState.addLocalQueryTarget(o,e);let c;return r&&(c=await R_(n,t,o,a==="current",s.resumeToken)),n.isPrimaryClient&&e&&Sl(n.remoteStore,s),c}async function R_(n,t,e,r,s){n.lc=(p,I,b)=>(async function(U,L,Q,J){let rt=L.view.ku(Q);rt.Uo&&(rt=await Su(U.localStore,L.query,!1).then((({documents:v})=>L.view.ku(v,rt))));const jt=J&&J.targetChanges.get(L.targetId),Tt=J&&J.targetMismatches.get(L.targetId)!=null,vt=L.view.applyChanges(rt,U.isPrimaryClient,jt,Tt);return ku(U,L.targetId,vt.ju),vt.snapshot})(n,p,I,b);const o=await Su(n.localStore,t,!0),a=new T_(t,o.Jo),c=a.ku(o.documents),h=Sr.createSynthesizedTargetChangeForCurrentChange(e,r&&n.onlineState!=="Offline",s),f=a.applyChanges(c,n.isPrimaryClient,h);ku(n,e,f.ju);const m=new v_(t,e,a);return n.ec.set(t,m),n.tc.has(e)?n.tc.get(e).push(t):n.tc.set(e,[t]),f.snapshot}async function P_(n,t,e){const r=j(n),s=r.ec.get(t),o=r.tc.get(s.targetId);if(o.length>1)return r.tc.set(s.targetId,o.filter((a=>!Us(a,t)))),void r.ec.delete(t);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(s.targetId),r.sharedClientState.isActiveQueryTarget(s.targetId)||await Li(r.localStore,s.targetId,!1).then((()=>{r.sharedClientState.clearQueryState(s.targetId),e&&Vo(r.remoteStore,s.targetId),Fi(r,s.targetId)})).catch(vn)):(Fi(r,s.targetId),await Li(r.localStore,s.targetId,!0))}async function S_(n,t){const e=j(n),r=e.ec.get(t),s=e.tc.get(r.targetId);e.isPrimaryClient&&s.length===1&&(e.sharedClientState.removeLocalQueryTarget(r.targetId),Vo(e.remoteStore,r.targetId))}async function C_(n,t,e){const r=L_(n);try{const s=await(function(a,c){const h=j(a),f=tt.now(),m=c.reduce(((b,x)=>b.add(x.key)),G());let p,I;return h.persistence.runTransaction("Locally write mutations","readwrite",(b=>{let x=Nt(),U=G();return h.Qo.getEntries(b,m).next((L=>{x=L,x.forEach(((Q,J)=>{J.isValidDocument()||(U=U.add(Q))}))})).next((()=>h.localDocuments.getOverlayedDocuments(b,x))).next((L=>{p=L;const Q=[];for(const J of c){const rt=xd(J,p.get(J.key).overlayedDocument);rt!=null&&Q.push(new Oe(J.key,rt,yc(rt.value.mapValue),Ht.exists(!0)))}return h.mutationQueue.addMutationBatch(b,f,Q,c)})).next((L=>{I=L;const Q=L.applyToLocalDocumentSet(p,U);return h.documentOverlayCache.saveOverlays(b,L.batchId,Q)}))})).then((()=>({batchId:I.batchId,changes:Mc(p)})))})(r.localStore,t);r.sharedClientState.addPendingMutation(s.batchId),(function(a,c,h){let f=a.oc[a.currentUser.toKey()];f||(f=new et(H)),f=f.insert(c,h),a.oc[a.currentUser.toKey()]=f})(r,s.batchId,e),await Dr(r,s.changes),await qs(r.remoteStore)}catch(s){const o=bo(s,"Failed to persist write");e.reject(o)}}async function Ml(n,t){const e=j(n);try{const r=await Kg(e.localStore,t);t.targetChanges.forEach(((s,o)=>{const a=e.sc.get(o);a&&(M(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?a.Zu=!0:s.modifiedDocuments.size>0?M(a.Zu,14607):s.removedDocuments.size>0&&(M(a.Zu,42227),a.Zu=!1))})),await Dr(e,r,t)}catch(r){await vn(r)}}function Nu(n,t,e){const r=j(n);if(r.isPrimaryClient&&e===0||!r.isPrimaryClient&&e===1){const s=[];r.ec.forEach(((o,a)=>{const c=a.view.Ru(t);c.snapshot&&s.push(c.snapshot)})),(function(a,c){const h=j(a);h.onlineState=c;let f=!1;h.queries.forEach(((m,p)=>{for(const I of p.Eu)I.Ru(c)&&(f=!0)})),f&&xo(h)})(r.eventManager,t),s.length&&r.Xu.zn(s),r.onlineState=t,r.isPrimaryClient&&r.sharedClientState.setOnlineState(t)}}async function b_(n,t,e){const r=j(n);r.sharedClientState.updateQueryState(t,"rejected",e);const s=r.sc.get(t),o=s&&s.key;if(o){let a=new et(F.comparator);a=a.insert(o,Vt.newNoDocument(o,$.min()));const c=G().add(o),h=new Pr($.min(),new Map,new et(H),a,Nt(),c);await Ml(r,h),r.rc=r.rc.remove(o),r.sc.delete(t),No(r)}else await Li(r.localStore,t,!1).then((()=>Fi(r,t,e))).catch(vn)}async function x_(n,t){const e=j(n),r=t.batch.batchId;try{const s=await Qg(e.localStore,t);Fl(e,r,null),Ul(e,r),e.sharedClientState.updateMutationState(r,"acknowledged"),await Dr(e,s)}catch(s){await vn(s)}}async function D_(n,t,e){const r=j(n);try{const s=await(function(a,c){const h=j(a);return h.persistence.runTransaction("Reject batch","readwrite-primary",(f=>{let m;return h.mutationQueue.lookupMutationBatch(f,c).next((p=>(M(p!==null,37113),m=p.keys(),h.mutationQueue.removeMutationBatch(f,p)))).next((()=>h.mutationQueue.performConsistencyCheck(f))).next((()=>h.documentOverlayCache.removeOverlaysForBatchId(f,m,c))).next((()=>h.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(f,m))).next((()=>h.localDocuments.getDocuments(f,m)))}))})(r.localStore,t);Fl(r,t,e),Ul(r,t),r.sharedClientState.updateMutationState(t,"rejected",e),await Dr(r,s)}catch(s){await vn(s)}}function Ul(n,t){(n.ac.get(t)||[]).forEach((e=>{e.resolve()})),n.ac.delete(t)}function Fl(n,t,e){const r=j(n);let s=r.oc[r.currentUser.toKey()];if(s){const o=s.get(t);o&&(e?o.reject(e):o.resolve(),s=s.remove(t)),r.oc[r.currentUser.toKey()]=s}}function Fi(n,t,e=null){n.sharedClientState.removeLocalQueryTarget(t);for(const r of n.tc.get(t))n.ec.delete(r),e&&n.Xu.Ec(r,e);n.tc.delete(t),n.isPrimaryClient&&n._c.s_(t).forEach((r=>{n._c.containsKey(r)||Bl(n,r)}))}function Bl(n,t){n.nc.delete(t.path.canonicalString());const e=n.rc.get(t);e!==null&&(Vo(n.remoteStore,e),n.rc=n.rc.remove(t),n.sc.delete(e),No(n))}function ku(n,t,e){for(const r of e)r instanceof kl?(n._c.addReference(r.key,t),N_(n,r)):r instanceof Ol?(O(Do,"Document no longer in limbo: "+r.key),n._c.removeReference(r.key,t),n._c.containsKey(r.key)||Bl(n,r.key)):B(19791,{hc:r})}function N_(n,t){const e=t.key,r=e.path.canonicalString();n.rc.get(e)||n.nc.has(r)||(O(Do,"New document in limbo: "+e),n.nc.add(r),No(n))}function No(n){for(;n.nc.size>0&&n.rc.size<n.maxConcurrentLimboResolutions;){const t=n.nc.values().next().value;n.nc.delete(t);const e=new F(Y.fromString(t)),r=n.uc.next();n.sc.set(r,new w_(e)),n.rc=n.rc.insert(e,r),Sl(n.remoteStore,new ie(Zt(Ji(e.path)),r,"TargetPurposeLimboResolution",Is.ce))}}async function Dr(n,t,e){const r=j(n),s=[],o=[],a=[];r.ec.isEmpty()||(r.ec.forEach(((c,h)=>{a.push(r.lc(h,t,e).then((f=>{var m;if((f||e)&&r.isPrimaryClient){const p=f?!f.fromCache:(m=e==null?void 0:e.targetChanges.get(h.targetId))==null?void 0:m.current;r.sharedClientState.updateQueryState(h.targetId,p?"current":"not-current")}if(f){s.push(f);const p=Io.vo(h.targetId,f);o.push(p)}})))})),await Promise.all(a),r.Xu.zn(s),await(async function(h,f){const m=j(h);try{await m.persistence.runTransaction("notifyLocalViewChanges","readwrite",(p=>C.forEach(f,(I=>C.forEach(I.wo,(b=>m.persistence.referenceDelegate.addReference(p,I.targetId,b))).next((()=>C.forEach(I.bo,(b=>m.persistence.referenceDelegate.removeReference(p,I.targetId,b)))))))))}catch(p){if(!wn(p))throw p;O(Ao,"Failed to update sequence numbers: "+p)}for(const p of f){const I=p.targetId;if(!p.fromCache){const b=m.$o.get(I),x=b.snapshotVersion,U=b.withLastLimboFreeSnapshotVersion(x);m.$o=m.$o.insert(I,U)}}})(r.localStore,o))}async function k_(n,t){const e=j(n);if(!e.currentUser.isEqual(t)){O(Do,"User change. New user:",t.toKey());const r=await Rl(e.localStore,t);e.currentUser=t,(function(o,a){o.ac.forEach((c=>{c.forEach((h=>{h.reject(new k(S.CANCELLED,a))}))})),o.ac.clear()})(e,"'waitForPendingWrites' promise is rejected due to a user change."),e.sharedClientState.handleUserChange(t,r.removedBatchIds,r.addedBatchIds),await Dr(e,r.zo)}}function O_(n,t){const e=j(n),r=e.sc.get(t);if(r&&r.Zu)return G().add(r.key);{let s=G();const o=e.tc.get(t);if(!o)return s;for(const a of o??[]){const c=e.ec.get(a);s=s.unionWith(c.view.Uu)}return s}}function ql(n){const t=j(n);return t.remoteStore.remoteSyncer.applyRemoteEvent=Ml.bind(null,t),t.remoteStore.remoteSyncer.getRemoteKeysForTarget=O_.bind(null,t),t.remoteStore.remoteSyncer.rejectListen=b_.bind(null,t),t.Xu.zn=__.bind(null,t.eventManager),t.Xu.Ec=y_.bind(null,t.eventManager),t}function L_(n){const t=j(n);return t.remoteStore.remoteSyncer.applySuccessfulWrite=x_.bind(null,t),t.remoteStore.remoteSyncer.rejectFailedWrite=D_.bind(null,t),t}class vs{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(t){this.serializer=bs(t.databaseInfo.databaseId),this.sharedClientState=this.Rc(t),this.persistence=this.Ic(t),await this.persistence.start(),this.localStore=this.Ac(t),this.gcScheduler=this.Vc(t,this.localStore),this.indexBackfillerScheduler=this.dc(t,this.localStore)}Vc(t,e){return null}dc(t,e){return null}Ac(t){return Hg(this.persistence,new jg,t.initialUser,this.serializer)}Ic(t){return new Vl(wo.C_,this.serializer)}Rc(t){return new Zg}async terminate(){var t,e;(t=this.gcScheduler)==null||t.stop(),(e=this.indexBackfillerScheduler)==null||e.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}vs.provider={build:()=>new vs};class M_ extends vs{constructor(t){super(),this.cacheSizeBytes=t}Vc(t,e){M(this.persistence.referenceDelegate instanceof Es,46915);const r=this.persistence.referenceDelegate.garbageCollector;return new Lm(r,t.asyncQueue,e)}Ic(t){const e=this.cacheSizeBytes!==void 0?xt.withCacheSize(this.cacheSizeBytes):xt.DEFAULT;return new Vl((r=>Es.C_(r,e)),this.serializer)}}class Bi{async initialize(t,e){this.localStore||(this.localStore=t.localStore,this.sharedClientState=t.sharedClientState,this.datastore=this.createDatastore(e),this.remoteStore=this.createRemoteStore(e),this.eventManager=this.createEventManager(e),this.syncEngine=this.createSyncEngine(e,!t.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>Nu(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=k_.bind(null,this.syncEngine),await f_(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(t){return(function(){return new m_})()}createDatastore(t){const e=bs(t.databaseInfo.databaseId),r=Pm(t.databaseInfo);return Dm(t.authCredentials,t.appCheckCredentials,r,e)}createRemoteStore(t){return(function(r,s,o,a,c){return new e_(r,s,o,a,c)})(this.localStore,this.datastore,t.asyncQueue,(e=>Nu(this.syncEngine,e,0)),(function(){return yu.C()?new yu:new Im})())}createSyncEngine(t,e){return(function(s,o,a,c,h,f,m){const p=new I_(s,o,a,c,h,f);return m&&(p.cc=!0),p})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,t.initialUser,t.maxConcurrentLimboResolutions,e)}async terminate(){var t,e;await(async function(s){const o=j(s);O(se,"RemoteStore shutting down."),o.tu.add(5),await xr(o),o.ru.shutdown(),o.iu.set("Unknown")})(this.remoteStore),(t=this.datastore)==null||t.terminate(),(e=this.eventManager)==null||e.terminate()}}Bi.provider={build:()=>new Bi};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class U_{constructor(t){this.observer=t,this.muted=!1}next(t){this.muted||this.observer.next&&this.mc(this.observer.next,t)}error(t){this.muted||(this.observer.error?this.mc(this.observer.error,t):ce("Uncaught Error in snapshot listener:",t.toString()))}gc(){this.muted=!0}mc(t,e){setTimeout((()=>{this.muted||t(e)}),0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ne="FirestoreClient";class F_{constructor(t,e,r,s,o){this.authCredentials=t,this.appCheckCredentials=e,this.asyncQueue=r,this._databaseInfo=s,this.user=At.UNAUTHENTICATED,this.clientId=Gi.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=o,this.authCredentials.start(r,(async a=>{O(Ne,"Received user=",a.uid),await this.authCredentialListener(a),this.user=a})),this.appCheckCredentials.start(r,(a=>(O(Ne,"Received new app check token=",a),this.appCheckCredentialListener(a,this.user))))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(t){this.authCredentialListener=t}setAppCheckTokenChangeListener(t){this.appCheckCredentialListener=t}terminate(){this.asyncQueue.enterRestrictedMode();const t=new Ge;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),t.resolve()}catch(e){const r=bo(e,"Failed to shutdown persistence");t.reject(r)}})),t.promise}}async function Ei(n,t){n.asyncQueue.verifyOperationInProgress(),O(Ne,"Initializing OfflineComponentProvider");const e=n.configuration;await t.initialize(e);let r=e.initialUser;n.setCredentialChangeListener((async s=>{r.isEqual(s)||(await Rl(t.localStore,s),r=s)})),t.persistence.setDatabaseDeletedListener((()=>n.terminate())),n._offlineComponents=t}async function Ou(n,t){n.asyncQueue.verifyOperationInProgress();const e=await B_(n);O(Ne,"Initializing OnlineComponentProvider"),await t.initialize(e,n.configuration),n.setCredentialChangeListener((r=>bu(t.remoteStore,r))),n.setAppCheckTokenChangeListener(((r,s)=>bu(t.remoteStore,s))),n._onlineComponents=t}async function B_(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){O(Ne,"Using user provided OfflineComponentProvider");try{await Ei(n,n._uninitializedComponentsProvider._offline)}catch(t){const e=t;if(!(function(s){return s.name==="FirebaseError"?s.code===S.FAILED_PRECONDITION||s.code===S.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11})(e))throw e;Qt("Error using user provided cache. Falling back to memory cache: "+e),await Ei(n,new vs)}}else O(Ne,"Using default OfflineComponentProvider"),await Ei(n,new M_(void 0));return n._offlineComponents}async function $l(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(O(Ne,"Using user provided OnlineComponentProvider"),await Ou(n,n._uninitializedComponentsProvider._online)):(O(Ne,"Using default OnlineComponentProvider"),await Ou(n,new Bi))),n._onlineComponents}function q_(n){return $l(n).then((t=>t.syncEngine))}async function Lu(n){const t=await $l(n),e=t.eventManager;return e.onListen=A_.bind(null,t.syncEngine),e.onUnlisten=P_.bind(null,t.syncEngine),e.onFirstRemoteStoreListen=V_.bind(null,t.syncEngine),e.onLastRemoteStoreUnlisten=S_.bind(null,t.syncEngine),e}function $_(n,t,e,r){const s=new U_(r),o=new E_(t,s,e);return n.asyncQueue.enqueueAndForget((async()=>p_(await Lu(n),o))),()=>{s.gc(),n.asyncQueue.enqueueAndForget((async()=>g_(await Lu(n),o)))}}function j_(n,t){const e=new Ge;return n.asyncQueue.enqueueAndForget((async()=>C_(await q_(n),t,e))),e.promise}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mu="AsyncQueue";class Uu{constructor(t=Promise.resolve()){this.qc=[],this.$c=!1,this.Kc=[],this.Wc=null,this.Qc=!1,this.Gc=!1,this.zc=[],this.xn=new Jc(this,"async_queue_retry"),this.jc=()=>{const r=yi();r&&O(Mu,"Visibility state changed to "+r.visibilityState),this.xn.gn()},this.Hc=t;const e=yi();e&&typeof e.addEventListener=="function"&&e.addEventListener("visibilitychange",this.jc)}get isShuttingDown(){return this.$c}enqueueAndForget(t){this.enqueue(t)}enqueueAndForgetEvenWhileRestricted(t){this.Jc(),this.Yc(t)}enterRestrictedMode(t){if(!this.$c){this.$c=!0,this.Gc=t||!1;const e=yi();e&&typeof e.removeEventListener=="function"&&e.removeEventListener("visibilitychange",this.jc)}}enqueue(t){if(this.Jc(),this.$c)return new Promise((()=>{}));const e=new Ge;return this.Yc((()=>this.$c&&this.Gc?Promise.resolve():(t().then(e.resolve,e.reject),e.promise))).then((()=>e.promise))}enqueueRetryable(t){this.enqueueAndForget((()=>(this.qc.push(t),this.Zc())))}async Zc(){if(this.qc.length!==0){try{await this.qc[0](),this.qc.shift(),this.xn.reset()}catch(t){if(!wn(t))throw t;O(Mu,"Operation failed with retryable error: "+t)}this.qc.length>0&&this.xn.mn((()=>this.Zc()))}}Yc(t){const e=this.Hc.then((()=>(this.Qc=!0,t().catch((r=>{throw this.Wc=r,this.Qc=!1,ce("INTERNAL UNHANDLED ERROR: ",Fu(r)),r})).then((r=>(this.Qc=!1,r))))));return this.Hc=e,e}enqueueAfterDelay(t,e,r){this.Jc(),this.zc.indexOf(t)>-1&&(e=0);const s=Co.createAndSchedule(this,t,e,r,(o=>this.Xc(o)));return this.Kc.push(s),s}Jc(){this.Wc&&B(47125,{el:Fu(this.Wc)})}verifyOperationInProgress(){}async tl(){let t;do t=this.Hc,await t;while(t!==this.Hc)}nl(t){for(const e of this.Kc)if(e.timerId===t)return!0;return!1}rl(t){return this.tl().then((()=>{this.Kc.sort(((e,r)=>e.targetTimeMs-r.targetTimeMs));for(const e of this.Kc)if(e.skipDelay(),t!=="all"&&e.timerId===t)break;return this.tl()}))}il(t){this.zc.push(t)}Xc(t){const e=this.Kc.indexOf(t);this.Kc.splice(e,1)}}function Fu(n){let t=n.message||"";return n.stack&&(t=n.stack.includes(n.message)?n.stack:n.message+`
`+n.stack),t}class yn extends Ds{constructor(t,e,r,s){super(t,e,r,s),this.type="firestore",this._queue=new Uu,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const t=this._firestoreClient.terminate();this._queue=new Uu(t),this._firestoreClient=void 0,await t}}}function ry(n,t,e){e||(e=ur);const r=Ju(n,"firestore");if(r.isInitialized(e)){const s=r.getImmediate({identifier:e}),o=r.getOptions(e);if(nr(o,t))return s;throw new k(S.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(t.cacheSizeBytes!==void 0&&t.localCache!==void 0)throw new k(S.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(t.cacheSizeBytes!==void 0&&t.cacheSizeBytes!==-1&&t.cacheSizeBytes<tl)throw new k(S.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return t.host&&ji(t.host)&&Wu(t.host),r.initialize({options:t,instanceIdentifier:e})}function sy(n,t){const e=typeof n=="object"?n:Ff(),r=typeof n=="string"?n:t||ur,s=Ju(e,"firestore").getImmediate({identifier:r});if(!s._initialized){const o=Mh("firestore");o&&Fm(s,...o)}return s}function jl(n){if(n._terminated)throw new k(S.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||z_(n),n._firestoreClient}function z_(n){var r,s,o,a;const t=n._freezeSettings(),e=km(n._databaseId,((r=n._app)==null?void 0:r.options.appId)||"",n._persistenceKey,(s=n._app)==null?void 0:s.options.apiKey,t);n._componentsProvider||(o=t.localCache)!=null&&o._offlineComponentProvider&&((a=t.localCache)!=null&&a._onlineComponentProvider)&&(n._componentsProvider={_offline:t.localCache._offlineComponentProvider,_online:t.localCache._onlineComponentProvider}),n._firestoreClient=new F_(n._authCredentials,n._appCheckCredentials,n._queue,e,n._componentsProvider&&(function(h){const f=h==null?void 0:h._online.build();return{_offline:h==null?void 0:h._offline.build(f),_online:f}})(n._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class G_{convertValue(t,e="none"){switch(ht(t)){case 0:return null;case 1:return t.booleanValue;case 2:return nt(t.integerValue||t.doubleValue);case 3:return this.convertTimestamp(t.timestampValue);case 4:return this.convertServerTimestamp(t,e);case 5:return t.stringValue;case 6:return this.convertBytes(Re(t.bytesValue));case 7:return this.convertReference(t.referenceValue);case 8:return this.convertGeoPoint(t.geoPointValue);case 9:return this.convertArray(t.arrayValue,e);case 11:return this.convertObject(t.mapValue,e);case 10:return this.convertVectorValue(t.mapValue);default:throw B(62114,{value:t})}}convertObject(t,e){return this.convertObjectMap(t.fields,e)}convertObjectMap(t,e="none"){const r={};return ke(t,((s,o)=>{r[s]=this.convertValue(o,e)})),r}convertVectorValue(t){var r,s,o;const e=(o=(s=(r=t.fields)==null?void 0:r[lr].arrayValue)==null?void 0:s.values)==null?void 0:o.map((a=>nt(a.doubleValue)));return new kt(e)}convertGeoPoint(t){return new ee(nt(t.latitude),nt(t.longitude))}convertArray(t,e){return(t.values||[]).map((r=>this.convertValue(r,e)))}convertServerTimestamp(t,e){switch(e){case"previous":const r=Vr(t);return r==null?null:this.convertValue(r,e);case"estimate":return this.convertTimestamp(dn(t));default:return null}}convertTimestamp(t){const e=Ve(t);return new tt(e.seconds,e.nanos)}convertDocumentKey(t,e){const r=Y.fromString(t);M(Qc(r),9688,{name:t});const s=new cr(r.get(1),r.get(3)),o=new F(r.popFirst(5));return s.isEqual(e)||ce(`Document ${o} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`),o}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zl extends G_{constructor(t){super(),this.firestore=t}convertBytes(t){return new zt(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new it(this.firestore,null,e)}}const Bu="@firebase/firestore",qu="4.16.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $u(n){return(function(e,r){if(typeof e!="object"||e===null)return!1;const s=e;for(const o of r)if(o in s&&typeof s[o]=="function")return!0;return!1})(n,["next","error","complete"])}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gl{constructor(t,e,r,s,o){this._firestore=t,this._userDataWriter=e,this._key=r,this._document=s,this._converter=o}get id(){return this._key.path.lastSegment()}get ref(){return new it(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const t=new H_(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(t)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var t;return((t=this._document)==null?void 0:t.data.clone().value.mapValue.fields)??void 0}get(t){if(this._document){const e=this._document.data.field(We("DocumentSnapshot.get",t));if(e!==null)return this._userDataWriter.convertValue(e)}}}class H_ extends Gl{data(){return super.data()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Q_(n){if(n.limitType==="L"&&n.explicitOrderBy.length===0)throw new k(S.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class ko{}class Hl extends ko{}function iy(n,t,...e){let r=[];t instanceof ko&&r.push(t),r=r.concat(e),(function(o){const a=o.filter((h=>h instanceof Lo)).length,c=o.filter((h=>h instanceof Oo)).length;if(a>1||a>0&&c>0)throw new k(S.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")})(r);for(const s of r)n=s._apply(n);return n}class Oo extends Hl{constructor(t,e,r){super(),this._field=t,this._op=e,this._value=r,this.type="where"}static _create(t,e,r){return new Oo(t,e,r)}_apply(t){const e=this._parse(t);return Ql(t._query,e),new Je(t.firestore,t.converter,Si(t._query,e))}_parse(t){const e=so(t.firestore);return(function(o,a,c,h,f,m,p){let I;if(f.isKeyField()){if(m==="array-contains"||m==="array-contains-any")throw new k(S.INVALID_ARGUMENT,`Invalid Query. You can't perform '${m}' queries on documentId().`);if(m==="in"||m==="not-in"){zu(p,m);const x=[];for(const U of p)x.push(ju(h,o,U));I={arrayValue:{values:x}}}else I=ju(h,o,p)}else m!=="in"&&m!=="not-in"&&m!=="array-contains-any"||zu(p,m),I=Hm(c,a,p,m==="in"||m==="not-in");return at.create(f,m,I)})(t._query,"where",e,t.firestore._databaseId,this._field,this._op,this._value)}}class Lo extends ko{constructor(t,e){super(),this.type=t,this._queryConstraints=e}static _create(t,e){return new Lo(t,e)}_parse(t){const e=this._queryConstraints.map((r=>r._parse(t))).filter((r=>r.getFilters().length>0));return e.length===1?e[0]:Kt.create(e,this._getOperator())}_apply(t){const e=this._parse(t);return e.getFilters().length===0?t:((function(s,o){let a=s;const c=o.getFlattenedFilters();for(const h of c)Ql(a,h),a=Si(a,h)})(t._query,e),new Je(t.firestore,t.converter,Si(t._query,e)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class Mo extends Hl{constructor(t,e){super(),this._field=t,this._direction=e,this.type="orderBy"}static _create(t,e){return new Mo(t,e)}_apply(t){const e=(function(s,o,a){if(s.startAt!==null)throw new k(S.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new k(S.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new pr(o,a)})(t._query,this._field,this._direction);return new Je(t.firestore,t.converter,Hd(t._query,e))}}function oy(n,t="asc"){const e=t,r=We("orderBy",n);return Mo._create(r,e)}function ju(n,t,e){if(typeof(e=ne(e))=="string"){if(e==="")throw new k(S.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!kc(t)&&e.indexOf("/")!==-1)throw new k(S.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${e}' contains a '/' character.`);const r=t.path.child(Y.fromString(e));if(!F.isDocumentKey(r))throw new k(S.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return ru(n,new F(r))}if(e instanceof it)return ru(n,e._key);throw new k(S.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${ws(e)}.`)}function zu(n,t){if(!Array.isArray(n)||n.length===0)throw new k(S.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${t.toString()}' filters.`)}function Ql(n,t){const e=(function(s,o){for(const a of s)for(const c of a.getFlattenedFilters())if(o.indexOf(c.op)>=0)return c.op;return null})(n.filters,(function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(t.op));if(e!==null)throw e===t.op?new k(S.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${t.op.toString()}' filter.`):new k(S.INVALID_ARGUMENT,`Invalid query. You cannot use '${t.op.toString()}' filters with '${e.toString()}' filters.`)}function K_(n,t,e){let r;return r=n?e&&(e.merge||e.mergeFields)?n.toFirestore(t,e):n.toFirestore(t):t,r}class Wn{constructor(t,e){this.hasPendingWrites=t,this.fromCache=e}isEqual(t){return this.hasPendingWrites===t.hasPendingWrites&&this.fromCache===t.fromCache}}class Ke extends Gl{constructor(t,e,r,s,o,a){super(t,e,r,s,a),this._firestore=t,this._firestoreImpl=t,this.metadata=o}exists(){return super.exists()}data(t={}){if(this._document){if(this._converter){const e=new is(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(e,t)}return this._userDataWriter.convertValue(this._document.data.value,t.serverTimestamps)}}get(t,e={}){if(this._document){const r=this._document.data.field(We("DocumentSnapshot.get",t));if(r!==null)return this._userDataWriter.convertValue(r,e.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new k(S.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t=this._document,e={};return e.type=Ke._jsonSchemaVersion,e.bundle="",e.bundleSource="DocumentSnapshot",e.bundleName=this._key.toString(),!t||!t.isValidDocument()||!t.isFoundDocument()?e:(this._userDataWriter.convertObjectMap(t.data.value.mapValue.fields,"previous"),e.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),e)}}Ke._jsonSchemaVersion="firestore/documentSnapshot/1.0",Ke._jsonSchema={type:ut("string",Ke._jsonSchemaVersion),bundleSource:ut("string","DocumentSnapshot"),bundleName:ut("string"),bundle:ut("string")};class is extends Ke{data(t={}){return super.data(t)}}class ln{constructor(t,e,r,s){this._firestore=t,this._userDataWriter=e,this._snapshot=s,this.metadata=new Wn(s.hasPendingWrites,s.fromCache),this.query=r}get docs(){const t=[];return this.forEach((e=>t.push(e))),t}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(t,e){this._snapshot.docs.forEach((r=>{t.call(e,new is(this._firestore,this._userDataWriter,r.key,r,new Wn(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(t={}){const e=!!t.includeMetadataChanges;if(e&&this._snapshot.excludesMetadataChanges)throw new k(S.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===e||(this._cachedChanges=(function(s,o){if(s._snapshot.oldDocs.isEmpty()){let a=0;return s._snapshot.docChanges.map((c=>{mt(s._snapshot.query)?Oi(s._snapshot.query):Xi(s.query._query);const h=new is(s._firestore,s._userDataWriter,c.doc.key,c.doc,new Wn(s._snapshot.mutatedKeys.has(c.doc.key),s._snapshot.fromCache),s.query.converter);return c.doc,{type:"added",doc:h,oldIndex:-1,newIndex:a++}}))}{let a=s._snapshot.oldDocs;return s._snapshot.docChanges.filter((c=>o||c.type!==3)).map((c=>{const h=new is(s._firestore,s._userDataWriter,c.doc.key,c.doc,new Wn(s._snapshot.mutatedKeys.has(c.doc.key),s._snapshot.fromCache),s.query.converter);let f=-1,m=-1;return c.type!==0&&(f=a.indexOf(c.doc.key),a=a.delete(c.doc.key)),c.type!==1&&(a=a.add(c.doc),m=a.indexOf(c.doc.key)),{type:W_(c.type),doc:h,oldIndex:f,newIndex:m}}))}})(this,e),this._cachedChangesIncludeMetadataChanges=e),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new k(S.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t={};t.type=ln._jsonSchemaVersion,t.bundleSource="QuerySnapshot",t.bundleName=Gi.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const e=[],r=[],s=[];return this.docs.forEach((o=>{o._document!==null&&(e.push(o._document),r.push(this._userDataWriter.convertObjectMap(o._document.data.value.mapValue.fields,"previous")),s.push(o.ref.path))})),t.bundle=(this._firestore,this.query._query,t.bundleName,"NOT SUPPORTED"),t}}function W_(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return B(61501,{type:n})}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ln._jsonSchemaVersion="firestore/querySnapshot/1.0",ln._jsonSchema={type:ut("string",ln._jsonSchemaVersion),bundleSource:ut("string","QuerySnapshot"),bundleName:ut("string"),bundle:ut("string")};function ay(n,t,e){n=oe(n,it);const r=oe(n.firestore,yn),s=K_(n.converter,t,e),o=so(r);return Uo(r,[jm(o,"setDoc",n._key,s,n.converter!==null,e).toMutation(n._key,Ht.none())])}function uy(n,t,e,...r){n=oe(n,it);const s=oe(n.firestore,yn),o=so(s);let a;return a=typeof(t=ne(t))=="string"||t instanceof xs?Gm(o,"updateDoc",n._key,t,e,r):zm(o,"updateDoc",n._key,t),Uo(s,[a.toMutation(n._key,Ht.exists(!0))])}function cy(n){return Uo(oe(n.firestore,yn),[new Yi(n._key,Ht.none())])}function ly(n,...t){var f,m,p;n=ne(n);let e={includeMetadataChanges:!1,source:"default"},r=0;typeof t[r]!="object"||$u(t[r])||(e=t[r++]);const s={includeMetadataChanges:e.includeMetadataChanges,source:e.source};if($u(t[r])){const I=t[r];t[r]=(f=I.next)==null?void 0:f.bind(I),t[r+1]=(m=I.error)==null?void 0:m.bind(I),t[r+2]=(p=I.complete)==null?void 0:p.bind(I)}let o,a,c;if(n instanceof it)a=oe(n.firestore,yn),c=Ji(n._key.path),o={next:I=>{t[r]&&t[r](Y_(a,n,I))},error:t[r+1],complete:t[r+2]};else{const I=oe(n,Je);a=oe(I.firestore,yn),c=I._query;const b=new zl(a);o={next:x=>{t[r]&&t[r](new ln(a,b,I,x))},error:t[r+1],complete:t[r+2]},Q_(n._query)}const h=jl(a);return $_(h,c,s,o)}function Uo(n,t){const e=jl(n);return j_(e,t)}function Y_(n,t,e){const r=e.docs.get(t._key),s=new zl(n);return new Ke(n,s,t._key,r,new Wn(e.hasPendingWrites,e.fromCache),t.converter)}(function(t,e=!0){Xf(Mf),as(new rr("firestore",((r,{instanceIdentifier:s,options:o})=>{const a=r.getProvider("app").getImmediate(),c=new yn(new ed(r.getProvider("auth-internal")),new sd(a,r.getProvider("app-check-internal")),Id(a,s),a);return o={useFetchStreams:e,...o},c._setSettings(o),c}),"PUBLIC").setMultipleInstances(!0)),un(Bu,qu,t),un(Bu,qu,"esm2020")})();export{Ff as a,ry as b,sy as c,ny as d,ay as e,ey as f,X_ as g,oy as h,Uf as i,cy as j,ly as o,iy as q,Z_ as s,uy as u};
