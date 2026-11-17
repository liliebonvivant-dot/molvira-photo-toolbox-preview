import torch,sys,json,hashlib
from safetensors.torch import load_file
sys.path.insert(0,'/tmp/birefnet')
from birefnet import BiRefNet,BiRefNetConfig
torch.set_num_threads(4)
config=BiRefNetConfig();config.bb_pretrained=False
m=BiRefNet(config=config);result=m.load_state_dict(load_file('/tmp/birefnet/official.safetensors'),strict=True);print(result,flush=True);m.eval()
class Wrapper(torch.nn.Module):
 def __init__(self,m):super().__init__();self.m=m
 def forward(self,x):return self.m(x)[-1]
from torch.onnx import symbolic_helper
@symbolic_helper.parse_args("v","v","v","v","v","i","i","i","i","i","i","i","i","b")
def deform(g,x,w,offset,mask,bias,sh,sw,ph,pw,dh,dw,groups,og,use_mask):
 return g.op("DeformConv",x,w,offset,bias,mask,strides_i=[sh,sw],pads_i=[ph,pw,ph,pw],dilations_i=[dh,dw],group_i=groups,offset_group_i=og)
torch.onnx.register_custom_op_symbolic("torchvision::deform_conv2d",deform,22)
x=torch.zeros(1,3,512,512)
with torch.no_grad():
 torch.onnx.export(Wrapper(m),x,'/tmp/birefnet/model-512.onnx',input_names=['input_image'],output_names=['output_image'],opset_version=22,dynamo=False)
print('exported',flush=True)
