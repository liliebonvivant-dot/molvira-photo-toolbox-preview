import { EcommerceWorkspace } from './ecommerce-workspace';
import { ProductAdWorkspace } from './product-ad-workspace';
import { WhatsAppWorkspace } from './whatsapp-workspace';
import { type Language, type Tool } from '@/lib/photo/content';
import { ResizeWorkspace } from './resize-workspace';
import { CropWorkspace } from './crop-workspace';
import { ConvertWorkspace } from './convert-workspace';
import { CompressWorkspace } from './compress-workspace';
import { WatermarkWorkspace } from './watermark-workspace';
import { BackgroundWorkspace } from './background-workspace';
import { TextEditorWorkspace } from './text-editor-workspace';
import { WhiteBackgroundWorkspace } from './white-background-workspace';
import { CollageWorkspace } from './collage-workspace';
import { InstagramWorkspace } from './instagram-workspace';
const workspaces = { ecommerce: EcommerceWorkspace, 'product-ad': ProductAdWorkspace, whatsapp: WhatsAppWorkspace, instagram: InstagramWorkspace, collage: CollageWorkspace, text: TextEditorWorkspace, 'white-background': WhiteBackgroundWorkspace, 'remove-background': BackgroundWorkspace, watermark: WatermarkWorkspace, compress: CompressWorkspace, resize: ResizeWorkspace, crop: CropWorkspace, convert: ConvertWorkspace };
export function Workspace(props: {tool:Tool;lang:Language;slug:string}) {
  const Editor=workspaces[props.tool.id];
  return <Editor {...props}/>;
}
