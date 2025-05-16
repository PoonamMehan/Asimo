import './index.css'
import { Outlet } from 'react-router-dom';

function App() {

  // const term = new Terminal({theme:{background: '#1e1e1e'}})
 
  return (
    <>
      {/* <Editor height="90vh" defaultLanguage="javascript" defaultValue={value} />; */}
      {/* <div ref={ref} style={{ height: '100%', width: '100%' }}></div> */}
      {/* <Outlet context={{term: term}} /> */}
      <Outlet />
    </>
  )
}

export default App
