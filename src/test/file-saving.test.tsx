import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FileSaving } from '@/components/photo/file-saving';
import { deliverConversion } from '@/lib/photo/convert-delivery';
vi.mock('@/lib/photo/convert-delivery', () => ({ deliverConversion: vi.fn().mockResolvedValue('downloadStarted') }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('shared file saving modes', () => {
 const result = { blob:new Blob(['ready'],{type:'image/jpeg'}),url:'blob:ready',key:'ready' };
 const props = { lang:'en' as const,result,filename:'ready.jpg',title:'Export',label:'Save',processing:'Processing',busy:false,disabled:false };
 it('retains the existing resize/crop primary download delivery', async () => {
  render(<FileSaving {...props}/>); fireEvent.click(screen.getByRole('button',{name:'Save'}));
  await waitFor(() => expect(deliverConversion).toHaveBeenCalledWith(result.blob,'ready.jpg','download'));
 });
 it('allows compression to reuse conversion touch auto-sharing without encoding again', async () => {
  render(<FileSaving {...props} mode="auto"/>); fireEvent.click(screen.getByRole('button',{name:'Save'}));
  await waitFor(() => expect(deliverConversion).toHaveBeenCalledWith(result.blob,'ready.jpg','auto'));
  await waitFor(() => expect(screen.getByRole('button',{name:'Save'})).toBeEnabled());
  fireEvent.click(screen.getByRole('button',{name:'Save'}));
  await waitFor(() => expect(deliverConversion).toHaveBeenCalledTimes(2));
 });
});