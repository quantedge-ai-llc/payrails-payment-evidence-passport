// New narrow local proxy: no merchant, payment-mutation or legacy routes.
import {defineConfig} from 'vite';
export default defineConfig({build:{sourcemap:false},server:{host:'127.0.0.1',port:5178,strictPort:true,proxy:{'^/v1/passports/[a-f0-9-]{36}(/recognize|/explanation)?$':{target:'http://127.0.0.1:4101'}}}});
