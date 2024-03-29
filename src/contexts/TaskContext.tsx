import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import firebase from 'firebase';
import app from '../services/firebase';
import RegisterModal from '../components/RegisterModal';
import DetailsModal from '../components/DetailsModal';

interface TaskProviderProps {
    children: React.ReactNode;
}

interface TaskContextData {
    tasks: Array<Task>;
    users: Array<User>;
    openRegisterModal: () => void;
    closeModal: () => void;
    openDetailsModal: (task: Task) => void;
}

interface User {
    id: string;
    name: string;
}

interface Task {
    id: string;
    status: string;
    title: string;
    description: string;
    onwer: {
        id: string;
        name: string
    };
    history: Array<{
        id: string;
        name: string;
        action: string;
        date: firebase.firestore.Timestamp;
    }>
}

export const TaskContext = createContext({} as TaskContextData);

export function useTasks(){
    return useContext(TaskContext);
}




export default function TaskProvider({ children }: TaskProviderProps) {    
    const [ tasks, setTasks ] = useState(new Array<Task>());
    const [ users, setUsers ] = useState(new Array<User>());
    const [ loading, setLoading ] = useState(true);
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ modal, setModal] = useState<JSX.Element | null>(null);
    const firestore = app.firestore();

    const loadTasks = useCallback(
        async () => {
            let collection = await firestore.collection('Tasks').limit(20).get();
            setTasks(
                collection.docs.map((doc: firebase.firestore.DocumentData) => {
                    let data = doc.data();
                    return {
                        id: doc.id,
                        status: data.status,
                        title: data.title,
                        description: data.description,
                        onwer: {
                            id: data.onwer.onwer_id,
                            name:  data.onwer.onwer_name
                        },
                        history: data.history
                    } as Task;
                })
            );
        },
        [setTasks, firestore],
    )
    const loadUsers = useCallback(
        async () => {
            let collection = await firestore.collection("Users").get();
            
            let users = collection.docs.map((doc: firebase.firestore.DocumentData) => {
                let data = doc.data();
                return {
                    id: doc.id,
                    name: data.name
                } as User;
            });
            
            setUsers(
                users
            );
        },
        [setUsers, firestore],
    )

    useEffect(() => {
        loadTasks().then((value) => {
            loadUsers().then((value) => {
                setLoading(false)
            })
        });
    }, [loadTasks, loadUsers]);

    function closeModal(){
        loadTasks();
        setIsModalOpen(false);
        setModal(null);
    }
    function openRegisterModal(){
        setModal(<RegisterModal/>)
        setIsModalOpen(true);
    }

    function openDetailsModal(task: Task){
        setModal(<DetailsModal task={task}/>)
        setIsModalOpen(true);
    }

    let value = {
        tasks,
        users,
        openRegisterModal,
        closeModal,
        openDetailsModal
    } as TaskContextData

    return (
        <TaskContext.Provider value={value}>
            { !loading && children }
            { !loading && isModalOpen && modal}
        </TaskContext.Provider>
    )
}
