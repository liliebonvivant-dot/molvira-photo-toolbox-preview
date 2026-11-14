import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Home } from '@/components/photo/home';
import { isLanguage, pageHead } from '@/lib/photo/content';
export const Route = createFileRoute('/')({component:Index,head:()=>pageHead('en')});
function Index(){const navigate=useNavigate();useEffect(()=>{let lang='en';try{lang=localStorage.getItem('molvira-photo-language')??'en';}catch{}if(isLanguage(lang))navigate({to:'/$lang',params:{lang},replace:true});},[navigate]);return <Home lang="en"/>;}
