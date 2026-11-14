import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@/components/photo/home';
import { isLanguage, pageHead } from '@/lib/photo/content';
export const Route=createFileRoute('/$lang/')({component:Page,head:({params})=>pageHead(isLanguage(params.lang)?params.lang:'en')});
function Page(){const {lang}=Route.useParams();return <Home lang={isLanguage(lang)?lang:'en'}/>;}
