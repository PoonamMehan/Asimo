import {useDispatch, useSelector} from 'react-redux'
import { useEffect, useState, useRef } from 'react'
import { addMessages, manageChatMsgHistory, manageAllFilesInWC} from '../store/filesAndFoldersSlice.js'
import { accessFileContentFromWC } from '../utils/webCon.js'
import { createFilesInWCUsingArray, getAllCurrentFolderAndFileNamesInWC} from '../utils/webCon.js'
import Editor from '@monaco-editor/react';
import arrow from "./next.png"
import { useOutletContext } from "react-router-dom";
import { useXTerm } from 'react-xtermjs'


export function ChatWithBolty(){

    const chatMsgHistory = useSelector((state)=> state.filesAndFolders.chatMsgHistory)
    const promptsArr = useSelector((state)=> state.filesAndFolders.promptsArr)
    const messages = useSelector((state)=> state.filesAndFolders.messages)
    const changedFiles = useSelector((state)=> state.filesAndFolders.changedFiles)
    const [currentPrompt, setCurrentPrompt] = useState("")
    const dispatch = useDispatch();
    const allFilesInWC = useSelector((state)=>state.filesAndFolders.allFilesInWC);
    const [fileContentForMonaco, setFileContentForMonaco] = useState("")
    const {instance, test} = useOutletContext()
    const [codeIsShown, setCodeIsShown] = useState(true)
    const url = useSelector((state)=> state.filesAndFolders.iframeURL)
    const {ref} = useXTerm()

    useEffect(()=>{console.log("URLh", url)}, [url])


    useEffect(()=>{
        const getDefaultEditorContent = async() => {
            const defaultFileOpenedContent = await accessFileContentFromWC("/package.json")
            setFileContentForMonaco(defaultFileOpenedContent)
        }
        getDefaultEditorContent();
        console.log("instance", instance?(instance):("nah"), "ref", ref?(ref):"nah2")
        
    }, [])
    

    async function changeTheFileOpened(filePath){
        console.log("Button clicked")
        const fileContent = await accessFileContentFromWC(filePath)
        setFileContentForMonaco(fileContent)
    }

    const fabricateLastMsg = async()=>{
        let msg = ''
        //file path + \n + ``` + \n + file content from WC (as an object) + \n + ``` + \n 
        await Promise.all(await changedFiles.map(async(filePath)=>{
            msg += filePath
            msg += "\n```\n"
            let currFileContent = await accessFileContentFromWC(filePath)
            msg += currFileContent
            msg += "\n```\n"
        })
        )
        
        return msg
    }

    const setMessagesInStore = (newMsgs)=>{
        dispatch(addMessages(newMsgs));
    }

    async function getCode(){
        //save the prompt in chatmsghistory, set the currentprompt(""), send the request to get-code endpoint, save the prompt in the prompts array -> beforesending the message handle the messages(pronpt set( the current pronpt and change the 5 pronpts up)()) -> get the response -> we have to pick apart the response and modify to show on the left(before parsed? in parsed? IN PARSED.) ([0], [length-1]) -> set in messages -> parse the response -> the mentioned files, add them in the changedFiles(store) if not exists already (think of an efficient data structure) -> createFilesInWCUsingArray() -> go through the parsed list here and as we encounter package.json add npm install in the text here (ALSO run npm install manually in the webcontainer and show in terminal) 
        //at the end setCurrentPrompt("")
        
        //save the prompt in chatmsghistory(store)
        const msgHistory = [...chatMsgHistory]
        msgHistory.push({role: "user", msg: currentPrompt})
        dispatch(manageChatMsgHistory(msgHistory))

        //set the messages
            //the prompts set up(at messages[3-7]) the last message(latest prompt+all the files that have been changed since the start of time, at the bigbang haha)
                //when there are 0's in messages array(deal eith prompt in a way that if (either stop at the idx = 4 or when 0 is encountered))
                //when there are no zeroes in messages array
        let extraText = `<bolt_running_commands>\n</bolt_running_commands>\n\nCurrent Message:\n\n${currentPrompt}\n\nFile Changes:\n\nHere is a list of all files that have been modified since the start of the conversation.This information serves as the true contents of these files!\n\nThe contents include either the full file contents or a diff (when changes are smaller and localized).\n\nUse it to:\n - Understand the latest file modifications\n - Ensure your suggestions build upon the most recent version of the files\n - Make informed decisions about changes\n - Ensure suggestions are compatible with existing code\n\n`
        const newMessagesArr = messages.map((msg)=>{return typeof msg === "object"? {...msg} : msg})


        for(let idx in newMessagesArr){
            if(newMessagesArr[idx] == 0){  
                //currentPrompt + content of files mentioned in changedFiles(analyze the format)
                //<boltcommnad/> Current Prompt. 
                
                const content = extraText + newMessagesArr[idx-1].content
                newMessagesArr[idx] = {role: "user", content: content}


                newMessagesArr[idx-1] = newMessagesArr[idx-2] //now take in effect of this while setting the response in messages
                
                //from idx [3- 0encountered in prompts/reached the end of prompts arr]
                let promptManageIdx = 3
                for(let i in promptsArr){
                    if(promptsArr[i] == 0){
                        break
                    }
                    newMessagesArr[promptManageIdx] = {role: "user", content: promptsArr[i]}
                    promptManageIdx++;
                }
               
                break;
            }else if(newMessagesArr[idx] != 0 && idx == 9){
                let promptManageIdx = 3;
                for(let i in promptsArr){
                    if(promptsArr[i] == 0){
                        break;
                    }
                    newMessagesArr[promptManageIdx] = {role: "user", content: promptsArr[i]}
                    promptManageIdx++;
                }

                const content = extraText + newMessagesArr[idx].content
                newMessagesArr[promptManageIdx] = {role: "user", content: content}
            }
        }

        //set this new and correct msgsArray in store and in session storage
        
        setMessagesInStore(newMessagesArr)

        const promptToGetCode = newMessagesArr.filter((curr)=> curr != 0 )//check this: if there are 0s in there, just get rid of them


        //send the req to /get-code endpoint
        await fetch('http://localhost:8000/api/v1/chat/get-code', {
            method: "Post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"msgs": [...promptToGetCode]}) 
        }).then(async (res)=>{
            const reader = res.body.reader()
            const decoder = new TextDecoder()
            let result = ""
            const writeableStream = new WritableStream({
                write(chunk){
                    result += decoder.decode(chunk, {stream: true})
                },
                close(){
                    //check whether this is necessary or not
                    //is necessary
                }
            })
            reader.pipeTo(writeableStream).then().catch()

            //set response in messages(store)
            const newMessagesArr2 = messages.map((msg)=>{return typeof msg === "object"? {...msg} : msg})
            
            for(i in newMessagesArr2){
                if(newMessagesArr2[i] == 0){
                    newMessagesArr2[i-2] = {role: "assistant", content: result}
                }else if(newMessagesArr2[i] != 0 && i == 9){
                    newMessagesArr2[i-1] = {role: "assistant", content: result}
                }   
            }



            //get the parsed response
            const parsedResp = parseXml(result)// [0] and [length-1] has the text
            //files in other elements

            //print on the left side -> save in chatMsgs
            //CHATMSGS: FOR NOW SAVE ALL, BUT CHANGE TO SAVING THE VERY FIRST MSG AND THE LAST MSG RESP AND PROMPT
            //parsed response -> in the initial /template add the full 'create initial files and folders', their file names, npm install. -> in this -> parsed response -> check if package.json is there, if yes, before the encounter of npm run dev add npm install in the string
            const strInTheLeft = parsedResp[0]
            const msgHistory2 = chatMsgHistory.map((msgObj) => {return {...msgObj}})
            msgHistory2.push({role: "assistant", msg: strInTheLeft}) 
            //save the string to print of the left side in CHATMSGHISTORY(store)
            dispatch(manageChatMsgHistory(msgHistory2))

            //build the files in WC using parsed response -> there make appropriate modifications to the chngedFiles array -> come here after all the files are mounted -> save the files in the last msg and upon refresh use this [length-1] to re mount all the files in WC -> save in the messages( use fabricatedMsg), save all the code of changed files

            await createFilesInWCUsingArray(parsedResp, changedFiles, instance, dispatch)

            const fabLastMsg = await fabricateLastMsg()

            for(i in newMessagesArr2){
                if(newMessagesArr2[i] == 0){
                    newMessagesArr2[i-1] = {role: "user", content: fabLastMsg}
                }else if(newMessagesArr2[i] != 0 && i == 9){
                    newMessagesArr2[i] = {role: "assistant", content: fabLastMsg}
                }   
            }

            //save the newMessagesArr2 in store dispatch()
            dispatch(addMessages(newMessagesArr2)) //maybe these dispatches needs to be done in a separate funtion

            //save the prompt in the prompts array but before consume the content of promptsArr
            const newPromptsArr = [...promptsArr]
            for(let p in newPromptsArr){
                if(newPromptsArr[p] == 0){
                    newPromptsArr[p] = currentPrompt;
                    break;
                }else if(p == 4 && newPromptsArr[p] != 0){
                    let idx = 1;
                    while(idx <= 4){
                        newPromptsArr[idx-1] = newPromptsArr[idx]
                        idx++;
                    }
                    newPromptsArr[4] = currentPrompt
                }
            }

            const allFileAndFolderInWC = await getAllCurrentFolderAndFileNamesInWC('', 0)
            dispatch(manageAllFilesInWC(allFileAndFolderInWC)) 

            //currenPrompt clear it
            setCurrentPrompt("")
            //streaming? 
        })
    }

    function changeToCode(){
        setCodeIsShown(true)
    }

    function changeToPreview(){
        setCodeIsShown(false)
    }

    return(
        <>
        {/* from initial request to template->get-code add the prompt and response formatted in the chatHistory(store+session storage) */}
            {/* take the prompt and save in prompts(store) -> request to backend(/get-code) -> the output send it to get parsed -> parsedResp to createFilesInWCUsingArray -> after the files are created now we need to show the resp in here as well(take a REGEXP, except the boltArtifact show everything -> chatHistory(store) will have all the formatted chats -> as the response came take the text except bolt artifact -> take the bolt artifact(create a string) -> string( text before bolt artifact -> parsed array -> one by one if there is a mention of package.json include the npm install in just before the npm run dev)(false-true-false state variable) -> for the initial thingy(not from here) )*/}


            {/* RENDER ALL THE MESSAGES HERE() */}
            {/* Try to stream the messages here */}
            {/* TAKE CARE OF THE WHOLE REFRESHING GAME */}
            <div className="flex min-h-screen min-w-screen bg-[#0a0a0a] text-white">
                <div className="flex min-h-screen min-w-screen bg-[radial-gradient(circle_250px_at_20%_-10%,rgba(128,0,255,0.7),rgba(128,0,255,0.2)_60%,transparent_100%)]">
                <div className="flex min-h-screen min-w-screen bg-[radial-gradient(circle_250px_at_10%_-15%,rgba(128,0,255,0.7),rgba(128,0,255,0.2)_60%,transparent_100%)] pl-6 pr-2 pt-4 pb-4 relative">
                {/* Left side chat Box */}
                    
                        <div className="flex flex-col pl-6 overflow-y-auto w-[30%] pr-12">

                            <div className="pl-6">
                                {chatMsgHistory.map((msg, idx)=>{
                                    if(msg.role == "user"){
                                        return (<div key={idx} className="flex flex-row bg-[#262626] items-center px-6 py-3 rounded-md max-w-[570px] mb-5 w-full">
                                            {/* <img className="inline-block"></img> */}
                                            <div className="bg-purple-900 rounded-full w-9 h-9 mr-3"></div>
                                            <div className="inline-block">{msg.msg}</div>
                                        </div>)
                                    }else if(msg.role == "assistant"){
                                        return (<div key={idx} className="flex flex-col bg-[#262626] items-center px-6 py-5 rounded-md w-full mb-5">
                                                {msg.msg && msg.msg.map((msgPart, idx)=> {
                                                    if(msgPart.type=="CreateFile"){
                                                        return <p key={idx} className="bg-[#171717] px-4 py-4 w-full">{msgPart.title}</p>
                                                    }else if(msgPart.type=="RunScript"){
                                                        return <p key={idx} className="bg-[#171717] px-4 py-4 w-full">
                                                        <span className="block bg-[#262626] px-4 py-4 rounded-md border-[#59595990] border-[1px]">
                                                            {msgPart.code}
                                                        </span>
                                                    </p>
                                                    }else if(msgPart.type=="Artifacts"){
                                                        return <p key={idx} className="bg-[#171717] px-4 py-4 w-full rounded-t-md">{msgPart.title}</p>
                                                    }else if(msgPart.type=="ExtraText"){
                                                        return <p key={idx} className="mb-4 w-full">{msgPart.content}</p>
                                                    }
                                                })}
                                                </div>
                                            )}})}
                            </div>

                            <div className="flex flex-row pl-6">
                                <input type="text" onChange={(e)=>setCurrentPrompt(e.target.value)} className="flex-1 bg-[#262626] p-2 rounded-md text-white focus:outline-none"></input>
                                <button className="" onClick={getCode}><div className="bg-[rgba(128,0,255,0.7)] px-1 py-2 rounded-md ml-2"><img src={arrow} alt="Create" className="w-7"></img></div></button>
                            </div> 

                        </div>


                        {/* Project preview and code */}
                        <div className="flex w-[70%] fixed right-0 top-0 flex-col pl-6 h-full pb-4">
                            <div className="flex flex-col absolute top-4 bg-[#1e1e1e] rounded-t-md rounded-r-md border-[1px] border-[#2f2f2f]">
                            <div className="py-1 px-2 border-b-[1px] border-[#2f2f2f] ">
                                <button onClick={changeToCode} className={`mr-1 py-2 px-4 ${codeIsShown? ("bg-[rgba(128,0,255,0.52)] py-2 px-4 rounded-full"):("")}`}>Code</button>
                                <button onClick={changeToPreview} className={`ml-1 py-2 px-4 ${!codeIsShown? ("bg-[rgba(128,0,255,0.54)] py-2 px-4 rounded-full"):("")}`}>Preview</button>
                            </div>
                            {codeIsShown? (<>
                            <div className="flex flex-grow">
                                <div className="flex flex-col p-2 h-[70vh] overflow-y-auto border-r-[1px] border-[#2f2f2f] ">
                                {allFilesInWC.map((element, idx)=>{
                                    return <div key={idx} onClick={()=>changeTheFileOpened(element.path)} className="hover:cursor-pointer whitespace-pre text-gray-300" dangerouslySetInnerHTML={{ __html: `<span style="color: #c1ccc2;">${element.val}</span>` }} ></div>
                                })}
                                </div>
                                <div className="flex-grow">   
                                    <Editor height="70vh" width="58vw" defaultLanguage="javascript" value={fileContentForMonaco} theme="vs-dark"/>
                                </div>
                            </div>
                            
                            </>):(url? (<iframe src={url}/>) : (<div className="w-full h-full bg-gray-900"></div>)
                                
                            )}
                            {codeIsShown? (<div className="border-[1px] border-[#2f2f2f] bg-[#1e1e1e]" ref={ref} style={{ height: '100%', width: '100%', color: "#1e1e1e"}}></div>):(<div></div>)}
                            
                        </div>
                        </div>
                    
                </div>
                </div>
            </div>
        </>
    )
}