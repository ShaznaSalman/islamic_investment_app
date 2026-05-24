'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { useInvestments } from '@/hooks/useInvestments';
import { useAuth } from '@/hooks/useAuth';
import { Document, Investment } from '@/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Upload, Download, Trash2, FileText, CheckCircle } from 'lucide-react';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DocumentsPageContent() {
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState('');
  const [uploadInvestmentId, setUploadInvestmentId] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const id = searchParams.get('investmentId');
    if (id) setSelectedInvestmentId(id);
  }, [searchParams]);

  const { data: investmentsData } = useInvestments();
  const investments = investmentsData?.investments || [];

  const investmentOptions = [
    { value: '', label: 'All Investments' },
    ...investments.map((i: Investment) => ({ value: i.id, label: i.title })),
  ];

  const investmentUploadOptions = investments.map((i: Investment) => ({ value: i.id, label: i.title }));

  const { data: docs = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents', selectedInvestmentId],
    queryFn: async () => {
      if (selectedInvestmentId) {
        const { data } = await api.get(`/api/investments/${selectedInvestmentId}/documents`);
        return data;
      }
      // Fetch docs for all investments
      const allDocs: Document[] = [];
      for (const inv of investments) {
        const { data } = await api.get(`/api/investments/${inv.id}/documents`);
        allDocs.push(...data);
      }
      return allDocs;
    },
    enabled: investments.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ investmentId, id }: { investmentId: string; id: string }) =>
      api.delete(`/api/investments/${investmentId}/documents/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document deleted'); },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: ({ investmentId, id }: { investmentId: string; id: string }) =>
      api.post(`/api/investments/${investmentId}/documents/${id}/acknowledge`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document acknowledged'); },
  });

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !uploadInvestmentId) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    if (uploadName) form.append('name', uploadName);
    try {
      await api.post(`/api/investments/${uploadInvestmentId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded');
      setUploadModalOpen(false);
      setUploadName('');
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function getFileIcon(type: string) {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('image')) return '🖼️';
    return '📎';
  }

  return (
    <>
      <Header
        title="Document Center"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documents' }]}
      />
      <div className="px-6 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <Select
            options={investmentOptions}
            value={selectedInvestmentId}
            onChange={(e) => setSelectedInvestmentId(e.target.value)}
            className="w-72"
          />
          {user?.role === 'OWNER' && (
            <Button onClick={() => setUploadModalOpen(true)}>
              <Upload size={16} /> Upload Document
            </Button>
          )}
        </div>

        <Card>
          <CardHeader title="Documents" subtitle={`${docs.length} document(s)`} />
          <CardBody className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-gray-400 text-center">Loading…</p>
            ) : docs.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No documents found.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {docs.map((doc: Document) => (
                  <li key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(doc.fileSizeBytes)} · Uploaded {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                      {doc.isAcknowledged && (
                        <Badge variant="success">
                          <CheckCircle size={10} className="mr-1" /> Acknowledged
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-primary-700 transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                      {!doc.isAcknowledged && user?.role === 'RECIPIENT' && (
                        <button
                          onClick={() => acknowledgeMutation.mutate({ investmentId: doc.investmentId, id: doc.id })}
                          className="text-xs text-primary-700 hover:underline"
                        >
                          Acknowledge
                        </button>
                      )}
                      {user?.role === 'OWNER' && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this document?')) {
                              deleteMutation.mutate({ investmentId: doc.investmentId, id: doc.id });
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Document"
        footer={
          <>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} loading={uploading}>Upload</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Investment"
            required
            options={investmentUploadOptions}
            placeholder="Select investment…"
            value={uploadInvestmentId}
            onChange={(e) => setUploadInvestmentId(e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Document Name (optional)</label>
            <input
              type="text"
              className="block w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="e.g. Investment Agreement - May 2026"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">File <span className="text-red-500">*</span></label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-400">PDF, Word, or image files. Max 20 MB.</p>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function DocumentsPageWrapper() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-400">Loading…</p>}>
      <DocumentsPageContent />
    </Suspense>
  );
}
