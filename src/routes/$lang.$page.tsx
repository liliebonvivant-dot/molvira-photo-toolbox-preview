import { createFileRoute, notFound } from '@tanstack/react-router';
import { isLanguage, pageHead, resolvePage } from '@/lib/photo/content';
import { Workspace } from '@/components/photo/workspace';
import { Institution } from '@/components/photo/institution';
import { isToolAvailable } from '@/lib/photo/availability';
export const Route=createFileRoute('/$lang/$page')({beforeLoad:({params})=>{if(!isLanguage(params.lang))throw notFound();const resolved=resolvePage(params.lang,params.page);if((!resolved.tool&&!resolved.institution)||(resolved.tool&&!isToolAvailable(resolved.tool.id)))throw notFound();},head:({params})=>pageHead(isLanguage(params.lang)?params.lang:'en',params.page),component:Page});
function Page(){const {lang,page}=Route.useParams();if(!isLanguage(lang))return null;const resolved=resolvePage(lang,page);if(resolved.tool)return <Workspace tool={resolved.tool} lang={lang} slug={page}/>;if(resolved.institution)return <Institution lang={lang} slug={page} page={resolved.institution}/>;return null;}
