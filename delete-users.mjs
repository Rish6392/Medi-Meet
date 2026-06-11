import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//const MY_EMAIL = "rishabh2.230101104@iiitbh.ac.in"; // <-- PUT YOUR EMAIL HERE

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: MY_EMAIL },
  });

  if (!user) {
    console.log(`User with email ${MY_EMAIL} not found!`);
    return;
  }

  // Delete all related records first
  await prisma.appointment.deleteMany({
    where: {
      OR: [
        { patientId: user.id },
        { doctorId: user.id }
      ]
    }
  });

  await prisma.creditTransaction.deleteMany({
    where: { userId: user.id }
  });

  await prisma.availability.deleteMany({
    where: { doctorId: user.id }
  });

  await prisma.payout.deleteMany({
    where: { doctorId: user.id }
  });

  // Now delete the user
  await prisma.user.delete({
    where: { id: user.id },
  });
  
  console.log(`Successfully deleted all data for user: ${MY_EMAIL}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
