const fs = require('fs');
const path = require('path');

const missionPath = path.join(__dirname, '../services/mission.ts');
let content = fs.readFileSync(missionPath, 'utf-8');

const idorCheck = `
  const mission = await getMissionById(supabase, missionId);
  if (!mission || mission.owner_id !== user.id) {
    throw new Error("Unauthorized");
  }
`;

content = content.replace(/export async function assignManager.*?\{\s*const \{ supabase, user \} = await getServerContext\(\);/s, 
  `export async function assignManager(missionId: string, managerId: string): Promise<AssignmentResult> {
  const { supabase, user } = await getServerContext();
${idorCheck}`
);

content = content.replace(/export async function assignEmployee.*?\{\s*const \{ supabase, user \} = await getServerContext\(\);/s, 
  `export async function assignEmployee(missionId: string, employeeId: string): Promise<AssignmentResult> {
  const { supabase, user } = await getServerContext();
${idorCheck}`
);

content = content.replace(/export async function removeManager.*?\{\s*const \{ supabase \} = await getServerContext\(\);/s, 
  `export async function removeManager(missionId: string, managerId: string): Promise<AssignmentResult> {
  const { supabase, user } = await getServerContext();
${idorCheck}`
);

content = content.replace(/export async function removeEmployee.*?\{\s*const \{ supabase \} = await getServerContext\(\);/s, 
  `export async function removeEmployee(missionId: string, employeeId: string): Promise<AssignmentResult> {
  const { supabase, user } = await getServerContext();
${idorCheck}`
);

fs.writeFileSync(missionPath, content);
console.log("mission.ts IDOR fixed");
