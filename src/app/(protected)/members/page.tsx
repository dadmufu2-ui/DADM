"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { database } from "@/lib/firebase";
import { ref, onValue, remove, update } from "firebase/database";
import { Search, Edit2, Trash2, Shield } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface Member {
  id: string;
  email: string;
  role: string;
}

export default function MembersPage() {
  const { role: currentUserRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  const canManageUsers = currentUserRole === "tesoureiro";

  useEffect(() => {
    const rolesRef = ref(database, 'roles');
    const unsubscribe = onValue(rolesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedMembers = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMembers(parsedMembers);
      } else {
        setMembers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, email: string) => {
    if (!canManageUsers) return;
    if (email === "danielalvesdasilvasantos60@gmail.com") {
      alert("Não é possível excluir o Tesoureiro Principal.");
      return;
    }
    
    if (confirm(`Tem certeza que deseja remover o acesso de ${email}?`)) {
      try {
        await remove(ref(database, `roles/${id}`));
      } catch (error) {
        alert("Erro ao remover usuário.");
      }
    }
  };

  const handleRoleChange = async (id: string, email: string, currentRole: string) => {
    if (!canManageUsers) return;
    if (email === "danielalvesdasilvasantos60@gmail.com") {
      alert("O nível do Tesoureiro Principal não pode ser alterado.");
      return;
    }

    const newRole = prompt(`Digite o novo nível para ${email}:\nOpções: tesoureiro, coordenador, adm_area, usuario_area, usuario, bloqueado\n(Dica: novos logins entram como "pendente")`, currentRole);
    
    if (newRole && ["tesoureiro", "coordenador", "adm_area", "usuario_area", "usuario", "bloqueado"].includes(newRole.toLowerCase())) {
      try {
        await update(ref(database, `roles/${id}`), { role: newRole.toLowerCase() });
      } catch (error) {
        alert("Erro ao atualizar o nível de acesso.");
      }
    } else if (newRole) {
      alert("Nível inválido. Use apenas: tesoureiro, coordenador, adm_area, usuario_area, usuario ou bloqueado.");
    }
  };

  const filteredMembers = members.filter(m => 
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 px-4 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-medium text-gray-900 dark:text-white tracking-wide">Membros da Diretoria</h2>
          <p className="text-[11px] text-gray-500 dark:text-[#8a8a8a] mt-1 tracking-widest uppercase">Gerenciamento de Acessos</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#151618] rounded-xl border border-gray-200 dark:border-[#1e1f22] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-[#1e1f22] flex items-center justify-between">
          <div className="relative w-[300px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#4c4e51]" />
            <Input 
              placeholder="Buscar por email ou nível..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#121315] border-gray-200 dark:border-[#2a2c30] text-gray-900 dark:text-white pl-10 focus-visible:ring-[#4c4e51] h-10 rounded-md"
            />
          </div>
          
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-gray-400 dark:text-[#4c4e51] uppercase tracking-widest px-3 py-1 bg-gray-50 dark:bg-[#121315] rounded-full border border-gray-200 dark:border-[#1e1f22]">
               {members.length} Registrados
             </span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 dark:border-[#1e1f22] hover:bg-transparent">
              <TableHead className="text-gray-500 dark:text-[#8a8a8a] text-[10px] font-bold uppercase tracking-widest py-5">Conta / E-mail</TableHead>
              <TableHead className="text-gray-500 dark:text-[#8a8a8a] text-[10px] font-bold uppercase tracking-widest py-5">Nível de Acesso</TableHead>
              <TableHead className="text-gray-500 dark:text-[#8a8a8a] text-[10px] font-bold uppercase tracking-widest py-5 text-center">Status</TableHead>
              <TableHead className="text-right text-gray-500 dark:text-[#8a8a8a] text-[10px] font-bold uppercase tracking-widest py-5">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow className="border-gray-200 dark:border-[#1e1f22] hover:bg-transparent">
               <TableCell colSpan={4} className="h-32 text-center text-gray-400 dark:text-[#4c4e51] font-medium text-[11px] tracking-widest uppercase">
                 Carregando usuários...
               </TableCell>
             </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow className="border-gray-200 dark:border-[#1e1f22] hover:bg-transparent">
                <TableCell colSpan={4} className="h-32 text-center text-gray-400 dark:text-[#4c4e51] font-medium text-[11px] tracking-widest uppercase">
                  Nenhum membro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id} className="border-gray-200 dark:border-[#1e1f22] hover:bg-gray-50 dark:hover:bg-[#1a1b1e] transition-colors group">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-[#1e2023] flex items-center justify-center text-gray-500 dark:text-[#8a8a8a] border border-gray-200 dark:border-[#2a2c30]">
                        <span className="text-[10px] font-bold">{member.email.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium text-[13px] tracking-wide">{member.email.split('@')[0]}</p>
                        <p className="text-gray-400 dark:text-[#4c4e51] text-[11px]">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className={`w-3.5 h-3.5 ${member.role === 'tesoureiro' ? 'text-white' : 'text-gray-400 dark:text-[#4c4e51]'}`} />
                      <span className="text-gray-500 dark:text-[#8a8a8a] text-[11px] font-medium uppercase tracking-widest">
                        {member.role}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {member.role === 'pendente' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-transparent text-[#eab308] border-[#eab308]/30">
                        Pendente
                      </span>
                    ) : member.role === 'bloqueado' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-transparent text-red-500 border-red-500/30">
                        Bloqueado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-gray-50 dark:bg-[#121315] text-gray-900 dark:text-white border-gray-200 dark:border-[#2a2c30]">
                        Ativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      {canManageUsers ? (
                        <>
                          <button 
                            title="Editar Nível" 
                            onClick={() => handleRoleChange(member.id, member.email, member.role)}
                            className="p-1.5 text-gray-400 dark:text-[#4c4e51] hover:text-white hover:bg-gray-200 dark:bg-[#2a2c30] rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {member.email !== 'danielalvesdasilvasantos60@gmail.com' && (
                            <button 
                              title="Remover Acesso" 
                              onClick={() => handleDelete(member.id, member.email)}
                              className="p-1.5 text-gray-400 dark:text-[#4c4e51] hover:text-[#ff4444] hover:bg-[#ff4444]/10 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400 dark:text-[#4c4e51] tracking-widest uppercase">Sem permissão</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



