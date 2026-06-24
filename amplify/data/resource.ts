import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // -----------------------------
  // Student-owned data models
  // Each signed-in student can read/write only their own records.
  // Frontend sync will be connected in the next phases.
  // -----------------------------
  StudentProfile: a
    .model({
      fullName: a.string(),
      email: a.string(),
      mobile: a.string(),
      className: a.string(),
      classLevel: a.string(), // 11th IIT JEE / 12th IIT JEE / Dropper
      city: a.string(),
      board: a.string(),
      preferredLanguage: a.string(),
      studyGoal: a.string(),
      dailyStudyTime: a.string(),
      weakAreas: a.string(),
      preferredContent: a.string(),
      avatarKey: a.string(),
      onboardingCompleted: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),

  UserPreferences: a
    .model({
      theme: a.string(), // light / dark
      activeTab: a.string(),
      classLevel: a.string(),
      compactMode: a.boolean(),
      notificationsEnabled: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),

  ExamTarget: a
    .model({
      targetName: a.string(),
      targetDate: a.string(), // YYYY-MM-DD
      targetType: a.string(), // JEE Main / JEE Advanced / Custom
      notes: a.string(),
      isActive: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),

  TopicProgress: a
    .model({
      classLevel: a.string(),
      subject: a.string(),
      chapterName: a.string(),
      topicName: a.string(),
      completed: a.boolean(),
      completedAt: a.string(),
      lastUpdatedAt: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  FlaggedTopic: a
    .model({
      classLevel: a.string(),
      subject: a.string(),
      chapterName: a.string(),
      topicName: a.string(),
      priority: a.string(), // low / medium / high
      note: a.string(),
      flaggedAt: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  StudySession: a
    .model({
      sessionDate: a.string(), // YYYY-MM-DD
      subject: a.string(),
      chapterName: a.string(),
      topicName: a.string(),
      durationSeconds: a.integer(),
      startedAt: a.string(),
      endedAt: a.string(),
      source: a.string(), // timer / manual
    })
    .authorization((allow) => [allow.owner()]),

  TimerGoal: a
    .model({
      label: a.string(),
      durationSeconds: a.integer(),
      isDefault: a.boolean(),
      lastUsedAt: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  PyqProgress: a
    .model({
      classLevel: a.string(),
      subject: a.string(),
      chapterName: a.string(),
      solvedCount: a.integer(),
      totalCount: a.integer(),
      lastSolvedAt: a.string(),
      difficulty: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  Task: a
    .model({
      title: a.string().required(),
      description: a.string(),
      classLevel: a.string(),
      subject: a.string(),
      chapterName: a.string(),
      topicName: a.string(),
      dueDate: a.string(),
      status: a.string(), // pending / completed
      completedAt: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  ActivityLog: a
    .model({
      activityType: a.string(), // topic_completed / pyq_solved / timer_session / task_completed
      title: a.string(),
      description: a.string(),
      subject: a.string(),
      chapterName: a.string(),
      topicName: a.string(),
      createdAtText: a.string(),
      relatedKey: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  StudyMaterialProgress: a
    .model({
      materialKey: a.string(),
      title: a.string(),
      subject: a.string(),
      status: a.string(), // not_started / in_progress / completed
      completedAt: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  TestAttempt: a
    .model({
      testKey: a.string(),
      title: a.string(),
      subject: a.string(),
      score: a.float(),
      totalMarks: a.float(),
      attemptedAt: a.string(),
      durationSeconds: a.integer(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  ContactMessage: a
    .model({
      name: a.string(),
      email: a.string(),
      reason: a.string(),
      message: a.string(),
      status: a.string(), // new / replied / closed
      submittedAt: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  DeleteDataRequest: a
    .model({
      email: a.string(),
      reason: a.string(),
      status: a.string(), // requested / processing / completed
      requestedAt: a.string(),
      completedAt: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  AppFeedback: a
    .model({
      rating: a.integer(),
      category: a.string(),
      message: a.string(),
      page: a.string(),
      submittedAt: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  // -----------------------------
  // App content/catalog models
  // Students can read these records. Admin editing will be added later.
  // For now, the frontend still uses the existing local content file.
  // -----------------------------
  ChapterCatalog: a
    .model({
      classLevel: a.string(),
      subject: a.string(),
      chapterName: a.string().required(),
      chapterOrder: a.integer(),
      sourceTrack: a.string(), // 11th / 12th / Dropper
      isActive: a.boolean(),
    })
    .authorization((allow) => [allow.authenticated().to(['read'])]),

  TopicCatalog: a
    .model({
      classLevel: a.string(),
      subject: a.string(),
      chapterName: a.string(),
      topicName: a.string().required(),
      topicOrder: a.integer(),
      isActive: a.boolean(),
    })
    .authorization((allow) => [allow.authenticated().to(['read'])]),

  PyqSet: a
    .model({
      classLevel: a.string(),
      subject: a.string(),
      chapterName: a.string(),
      title: a.string(),
      totalQuestions: a.integer(),
      difficulty: a.string(),
      sourceType: a.string(),
      isActive: a.boolean(),
    })
    .authorization((allow) => [allow.authenticated().to(['read'])]),

  StudyMaterial: a
    .model({
      classLevel: a.string(),
      subject: a.string(),
      chapterName: a.string(),
      title: a.string(),
      materialType: a.string(), // formula / notes / checklist / link
      description: a.string(),
      url: a.string(),
      isActive: a.boolean(),
    })
    .authorization((allow) => [allow.authenticated().to(['read'])]),

  TestSeries: a
    .model({
      classLevel: a.string(),
      subject: a.string(),
      title: a.string(),
      testType: a.string(), // chapter / mock / weak-topic
      totalMarks: a.float(),
      durationMinutes: a.integer(),
      isActive: a.boolean(),
    })
    .authorization((allow) => [allow.authenticated().to(['read'])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
