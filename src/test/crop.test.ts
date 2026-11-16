import { describe,it,expect } from 'vitest';
import { cropEdit,flipEdit,fitRatio,originalEdit,point,rotateEdit } from '@/lib/photo/crop';
describe('crop and rotation geometry',()=>{
 it('crops without scaling the source',()=>{const edit=cropEdit(originalEdit(400,300),{x:20,y:30,width:100,height:70});expect([edit.width,edit.height]).toEqual([100,70]);expect(point(edit.matrix,{x:20,y:30})).toEqual({x:0,y:0});expect(edit.matrix.slice(0,4)).toEqual([1,0,0,1]);});
 for(const ratio of [1,4/3,3/4,16/9,9/16])it(`fits ${ratio} inside the image without borders`,()=>{const rect=fitRatio(400,300,ratio);expect(rect.width/rect.height).toBeCloseTo(ratio);expect(rect.width).toBeLessThanOrEqual(400);expect(rect.height).toBeLessThanOrEqual(300);});
 it.each([-90,90])('swaps dimensions for %s degrees',(angle)=>{const edit=rotateEdit(originalEdit(400,300),angle,true);expect([edit.width,edit.height]).toEqual([300,400]);});
 it('rotates 180 degrees',()=>{const edit=rotateEdit(originalEdit(400,300),180,true);expect(point(edit.matrix,{x:0,y:0})).toEqual({x:400,y:300});});
 it('expands manual rotation bounds',()=>{const edit=rotateEdit(originalEdit(400,300),45,true);expect([edit.width,edit.height]).toEqual([495,495]);});
 it('clips manual rotation with fixed bounds',()=>{const edit=rotateEdit(originalEdit(400,300),45,false);expect([edit.width,edit.height]).toEqual([400,300]);expect(edit.clips).toHaveLength(1);});
 it('mirrors horizontally',()=>expect(point(flipEdit(originalEdit(400,300),true).matrix,{x:10,y:20})).toEqual({x:390,y:20}));
 it('mirrors vertically',()=>expect(point(flipEdit(originalEdit(400,300),false).matrix,{x:10,y:20})).toEqual({x:10,y:280}));
 it('combines crop rotation and mirroring retaining clipping',()=>{const edit=flipEdit(rotateEdit(cropEdit(originalEdit(400,300),{x:20,y:30,width:100,height:70}),90,true),true);expect([edit.width,edit.height]).toEqual([70,100]);expect(point(edit.matrix,{x:20,y:30})).toEqual({x:0,y:0});expect(edit.clips).toHaveLength(1);});
});