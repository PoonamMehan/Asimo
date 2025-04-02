import { WebContainer } from '@webcontainer/api';
import { useDispatch, useSelector } from 'react-redux';
import { manageChangedFiles, setIframeURL } from '../store/filesAndFoldersSlice';
import store from '../store/store.js'

const webcontainerInstance = await WebContainer.boot();

//function which will map over object (uiPrompts)
//function that is taking the key and separates all the directory names and the file name 
    // for every folder name it will mkdir
    //for the file it will await webcontainerInstance.mount(files, { mountPoint: 'my-mount-point' }); 
        //mount point is a string of all directory names joined using '/'


export async function createFilesInWCFromObj(filesObj){
    // console.log(Object.keys(filesObj))
    await Promise.all(
        Object.keys(filesObj).map(async(k)=> {
        await createFileInWC(k, filesObj[k])
    })
    );
    
}


export async function createFilesInWCUsingArray(filesArr, changedFiles, instance, dispatch){
    let packageJsonExists = false
    const mySetOfChangedFiles = new Set(changedFiles);
    console.log("ch files", changedFiles)
    console.log("running")
    //analyse the array
    //ignore the filesArr[0] which has the bolt artifact in it
    //two types of entries: CreateFile or RunScript
    //create function to run script in WC -> the scripts need to be shown in the terminal and the output too
    await Promise.all(filesArr.map(async(task)=>{
        if(task.type == "CreateFile"){
            await createFileInWC(task.path, task.code)
            //if the file's name is package.json -> run npm install -> tell in a variable that npm install ran -> this has to be added to the left side text by the runScriptInWC
            //add this in the left side text too
            if(task.path.includes("package.json")){
                packageJsonExists = true
            }
            mySetOfChangedFiles.add(task.path)
            //keep the name of the files mentioned inside the changedFiles(store)
            
        }else if(task.type == "RunScript"){
            if(task.code == "npm run dev" && packageJsonExists){
                //first run npm install
                instance?.writeln('npm install')
                await runScriptInWC("npm install", instance, dispatch)
                instance?.writeln(task.code)
                runScriptInWC(task.code, instance, dispatch)
            }else if(task.code == "npm run dev"){
                instance?.writeln(task.code)
                runScriptInWC(task.code, instance, dispatch)
            }
            else{
                instance?.writeln(task.code)
                await runScriptInWC(task.code, instance, dispatch)
            }
            
            //add this in the left side text too
            //either here or in the runScriptInWC(preferably here)
        }
    }))
    
    console.log("running complete")
    store.dispatch(manageChangedFiles(Array.from(mySetOfChangedFiles)))
}

//check if some command is running currently, when it stops running, run the next command.

        // while (true) {
        //     const processList = await webcontainerInstance.spawn("ps", []);
        //     const reader = processList.output.getReader();
        //     let output = "";
    
        //     while (true) {
        //         const { value, done } = await reader.read();
        //         if (done) break;
        //         console.log(value)
        //         output += value;
        //     }
            
        //     console.log("Running processes:", output);
    
        //     // If no processes except "ps" are running, exit the loop
        //     if (output.trim().split("\n").length <= 1) {
        //         break;
        //     }
    
        //     // Wait for a second before checking again
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        // }
export async function runScriptInWC(script, instance, dispatch){
        
        const scriptArr = script.split(' ');
        const cmdOptnsArr = scriptArr.filter((element, idx)=> idx!=0 )
        console.log("here3")
        console.log(scriptArr[0], cmdOptnsArr)
        const controller = new AbortController();
        const { signal } = controller;


        const cmdOutput = await webcontainerInstance.spawn(scriptArr[0], cmdOptnsArr)
        try{
            await cmdOutput.output.pipeTo(new WritableStream({
            write(data) {
                instance.write(data)
                console.log(script)
                console.log(data)
                if(data.trim()=="run `npm fund` for details"){
                    console.log("it met")
                    console.log("Available methods", Object.getOwnPropertyNames(Object.getPrototypeOf(cmdOutput)))
                    cmdOutput.kill()
                    controller.abort()
                }
            }, 
            close(){
                console.log("it reaches here fsfsfs")
                cmdOutput.kill();
            }
        }), {signal})
        }catch(error){
            console.log("err", error)
            console.log("err name", error.name)
            if(error.name == "AbortError"){
                console.log("Intentionally stream was stopped")
            }else{
                console.log("Stream stopped unexpectedly")
            }
        }

        if(script.trim() == "npm run dev"){
            console.log(script, "herehrehreh")
            webcontainerInstance.on('server-ready', (port, url)=>{
                console.log("URL", url)
            dispatch(setIframeURL(url))
            })
        }

        console.log("Script ran: ", script)
}
        //when this will run, add this to the xterm.js and also show the output in the terminal
        // const reader = cmdOutput.output.getReader();

        // Read from stream manually
        // async function readStream() {
        //     while (true) {
        //         const { done, value } = await reader.read();
        //         if (done) {
        //             console.log("Command execution completed:", script);
        //             break;
        //         }
        //         console.log(script)
        //         instance.write(value);
        //         console.log("Output:", value);
        //     }
        // }
    
        // await readStream(); // Ensure execution completes


//this function handles adding files to the root folders as well as to the nested folders
async function createFileInWC(fileLocation, fileContent){
    //two no folders                 multiple folders
    //string(path) -> take the path and split it at '/' -> if the array.length == 1  then just create that file -> else array[length-1] create file before that from 0 to n-2 (minimum 0th folder) create folders

    const pathArr = fileLocation.split('/')
    const pathArrLen = pathArr.length;

    if(pathArrLen == 1){
        const files = {
            [fileLocation]: {
              file: {
                contents: fileContent,
              },
            },
          };
        try{
            await webcontainerInstance.mount(files)
            console.log(fileLocation, " mounted")
        }catch(err){
            console.log("Error while mounting a file in WC: ", err)
        }
    }else{
        let i = 0;
        while(i < pathArrLen-1){
            try{
                await webcontainerInstance.fs.readdir(pathArr.slice(0, i+1).join('/'));
            }catch(err){
                await webcontainerInstance.fs.mkdir(pathArr.slice(0, i+1).join('/') , { recursive: true });
            }
            i++;
        }
        
        const files = {
            [pathArr[pathArrLen-1]]: {
                file: {
                    contents: fileContent,
                },
            },
        };

        try{
            await webcontainerInstance.mount(files, { mountPoint: pathArr.slice(0, pathArrLen-1).join('/') })
            console.log(fileLocation, " mounted")
        }catch(err){
            console.log("Error while mounting a file in WC: ", err)
        }
    }
}

export async function accessFileContentFromWC(filePath){
    console.log("running to access the files")
    const file = await webcontainerInstance.fs.readFile(filePath, 'utf-8');
    return file;
}

export async function getAllCurrentFolderAndFileNamesInWC(folderPath, indent){

    let files = await webcontainerInstance.fs.readdir(folderPath, {
        withFileTypes: true
    })

    files = await Promise.all(files.map(async(currFileOrFolder)=>{
        if(currFileOrFolder.isFile()){
            let indents = ""
            let timesAdded = 0
            while(timesAdded < indent){
                indents += "&nbsp;&nbsp;"
                timesAdded++;
            }
            const val = indents + currFileOrFolder.name
            return {...currFileOrFolder, val: val, path: folderPath+"/"+currFileOrFolder.name}
        }else {
            //insert in files: {...currFileOrFolder, val: val}
            //then insert all the nested filesAndFolders
            if(currFileOrFolder.name != "node_modules"){
                let indents = ""
            let timesAdded = 0
            while(timesAdded < indent){
                indents += "&nbsp;&nbsp;"
                timesAdded++;
            }
            const currFolderPath = folderPath + "/" + currFileOrFolder.name
            const val = indents + currFileOrFolder.name
            let nestedFilesAndFolders = [{...currFileOrFolder, val: val, path: currFolderPath}]
            
            let nestedFiles = await getAllCurrentFolderAndFileNamesInWC(currFolderPath, indent+1)

            nestedFilesAndFolders = [...nestedFilesAndFolders, ...nestedFiles]
            return nestedFilesAndFolders;
            }else{
                return {...currFileOrFolder, val: currFileOrFolder.name, path: "/" + currFileOrFolder.name}
            }
        }
    }))

    
    return files.flat();
}
//handle when there is no folder and handle when there are multiple folders 












//check if mkdir is overwriting the contents of the already existing directory upon getting created once again if it already existed


