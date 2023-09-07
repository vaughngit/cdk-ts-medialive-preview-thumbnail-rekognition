
export type Event = {
    field: string
    action: string
    startDate: string | undefined
    endDate: string | undefined
    cron: string
    description: string
    timeZone: string  | undefined
    schedulerName: string 
    channelInfoPayload: {
        AWS_REGION: string
        ChannelId: string
        PipelineId: string
        ThumbnailType: string
    },
    source : {
      id: string 
    }
  }