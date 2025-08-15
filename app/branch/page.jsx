"use client";
import Header from '@/components/v1/branch/Header';
import React, { useEffect, useState } from 'react';
import BranchTable from '@/components/v1/branch/BranchTable';
import { getUsersByRole } from '@/services/pocketbase/readUsers';
import ViewAdmin from '@/components/v1/branch/ViewAdmin';
import EditAdmin from '@/components/v1/branch/EditAdmin';
import { deleteUser } from '@/services/pocketbase/deleteUsers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Page = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAdmins = React.useCallback(() => {
    setLoading(true);
    getUsersByRole('admin')
      .then((users) => setAdmins(users || []))
      .catch(() => setAdmins([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleView = React.useCallback((admin) => {
    setSelectedAdmin(admin);
    setViewOpen(true);
  }, []);

  const handleEdit = React.useCallback((admin) => {
    setSelectedAdmin(admin);
    setEditOpen(true);
  }, []);

  const handleDelete = React.useCallback((admin) => {
    setSelectedAdmin(admin);
    setDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!selectedAdmin) return;
    setDeleting(true);
    try {
      await deleteUser(selectedAdmin.id);
      setDeleteOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
      toast('Admin deleted', { description: 'The admin was deleted successfully.' });
    } catch (err) {
      toast.error('Delete failed', { description: err.message || 'Failed to delete admin' });
    } finally {
      setDeleting(false);
    }
  }, [selectedAdmin, fetchAdmins]);

  return (
    <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col' key="branch-page">
      <Header onCreated={fetchAdmins} />
      <BranchTable
        users={admins}
        isLoading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <ViewAdmin open={viewOpen} onOpenChange={setViewOpen} admin={selectedAdmin} />
      <EditAdmin open={editOpen} onOpenChange={setEditOpen} admin={selectedAdmin} onSuccess={fetchAdmins} />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Admin</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this admin? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;