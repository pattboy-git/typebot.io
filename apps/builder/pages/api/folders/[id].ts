import { withSentry } from '@sentry/nextjs'
import { DashboardFolder, User } from 'db'
import prisma from 'libs/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { methodNotAllowed } from 'utils'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession({ req })

  if (!session?.user)
    return res.status(401).json({ message: 'Not authenticated' })

  const id = req.query.id.toString()
  const user = session.user as User
  if (req.method === 'GET') {
    const folder = await prisma.dashboardFolder.findUnique({
      where: { id_ownerId: { id, ownerId: user.id } },
    })
    return res.send({ folder })
  }
  if (req.method === 'DELETE') {
    const folders = await prisma.dashboardFolder.delete({
      where: { id_ownerId: { id, ownerId: user.id } },
    })
    return res.send({ folders })
  }
  if (req.method === 'PATCH') {
    const data = JSON.parse(req.body) as Partial<DashboardFolder>
    const folders = await prisma.dashboardFolder.update({
      where: { id_ownerId: { id, ownerId: user.id } },
      data,
    })
    return res.send({ typebots: folders })
  }
  return methodNotAllowed(res)
}

export default withSentry(handler)
