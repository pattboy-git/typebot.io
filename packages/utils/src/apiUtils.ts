import { Typebot, Answer, VariableWithValue, ResultWithAnswers } from 'models'
import { NextApiRequest, NextApiResponse } from 'next'
import { byId, isDefined } from '.'

export const methodNotAllowed = (res: NextApiResponse) =>
  res.status(405).json({ message: 'Method Not Allowed' })

export const initMiddleware =
  (
    handler: (
      req: NextApiRequest,
      res: NextApiResponse,
      middleware: (result: any) => void
    ) => void
  ) =>
  (req: any, res: any) =>
    new Promise((resolve, reject) => {
      handler(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result)
        }
        return resolve(result)
      })
    })

export const parseAnswers =
  ({ blocks, variables }: Pick<Typebot, 'blocks' | 'variables'>) =>
  (result: ResultWithAnswers) => ({
    submittedAt: result.createdAt,
    ...[...result.answers, ...result.prefilledVariables].reduce<{
      [key: string]: string
    }>((o, answerOrVariable) => {
      if ('blockId' in answerOrVariable) {
        const answer = answerOrVariable as Answer
        const key = answer.variableId
          ? variables.find(byId(answer.variableId))?.name
          : blocks.find(byId(answer.blockId))?.title
        if (!key) return o
        return {
          ...o,
          [key]: answer.content,
        }
      }
      const variable = answerOrVariable as VariableWithValue
      if (isDefined(o[variable.id])) return o
      return { ...o, [variable.id]: variable.value }
    }, {}),
  })
