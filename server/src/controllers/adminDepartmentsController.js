import { listDepartments, createDepartment, updateDepartment } from '../services/departmentService.js';

export async function getAdminDepartments(_req, res) {
  const data = await listDepartments(false);
  res.json({ data });
}

export async function postAdminDepartment(req, res) {
  const data = await createDepartment(req.body.name);
  res.status(201).json({ data });
}

export async function patchAdminDepartment(req, res) {
  const data = await updateDepartment(req.params.id, req.body);
  res.json({ data });
}
