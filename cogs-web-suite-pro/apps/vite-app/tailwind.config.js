export default {
  content:['./index.html','./src/**/*.{ts,tsx}'],
  theme:{
    extend:{
      colors:{
        brand:{ DEFAULT:'#0ea5e9', 50:'#f0f9ff', 100:'#e0f2fe', 500:'#0ea5e9', 700:'#0369a1', 900:'#0b1324' }
      },
      borderRadius:{ '2xl':'1.25rem' }
    }
  },
  plugins:[]
}
