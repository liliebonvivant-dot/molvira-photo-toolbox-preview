import horizontal from '@/assets/molvira-photo-horizontal.png.asset.json';
import icon from '@/assets/molvira-photo-icon.png.asset.json';
export function Brand({ compact=false }: {compact?:boolean}) { return <img className={compact?'brand-icon':'brand-horizontal'} src={compact?icon.url:horizontal.url} alt="MOLVIRA PHOTO" width={compact?64:240} height={compact?64:80}/>; }
