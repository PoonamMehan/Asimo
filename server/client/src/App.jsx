import './App.css'
import {useState, useEffect, useRef} from 'react'
import { Outlet } from 'react-router-dom';
import { useXTerm } from 'react-xtermjs'

function App() {
  
  
  
  const {instance, ref} = useXTerm()
useEffect(()=>{
    //make value a state and when it changes, make change in the monaco model
      console.log(instance, ref)
      //when change is from the llm 
      //when  change is from the user(save this and give it to the llm) (how are we saving the convo?)
  }, [instance, ref])

  // useEffect(() => {
  //   // Load the fit addon
  //   instance?.loadAddon(fitAddon)

  //   const handleResize = () => fitAddon.fit()

  //   // Write custom message on your terminal
  //   instance?.writeln('Welcome react-xtermjs!')
  //   instance?.writeln('This is a simple example using an addon.')
  //   instance?.writeln('write any thing on our own but about the user?')

  //   instance?.onData((d)=>{
  //     instance?.write(d)
  //   })
  //   // Handle resize event
    
  //   window.addEventListener('resize', handleResize)
  //   return () => {
  //     window.removeEventListener('resize', handleResize)
  //   }
  // }, [ref, instance])

    

  // const onResize = (cols, rows) => {
  //   console.log(`Terminal resized to ${cols} columns and ${rows} rows`)
  // } onResize={onResize}
  
 
  return (
    <>
      {/* <Editor height="90vh" defaultLanguage="javascript" defaultValue={value} />; */}
      {/* <div ref={ref} style={{ height: '100%', width: '100%' }}></div> */}
      <Outlet context={{instance: instance, ref:ref, test: "WORKING WORKING WORKING"}}/>
    </>
  )
}

export default App
