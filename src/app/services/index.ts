


import {
  NilmService,
  DbFolderService,
  DbStreamService,
  DataService,
  DataViewService,
  SessionService,
  PermissionService,
  UserGroupService,
  UserService,
  ColorService,
  DbElementService,
  AnnotationService,
  EventStreamService,
  JouleService
} from './api';

import {
  MessageService
} from './message.service';

export const SERVICE_PROVIDERS =
  [NilmService, DbFolderService, MessageService, DataViewService,
    DbStreamService, SessionService,DataService, ColorService,
    PermissionService, UserGroupService, UserService, DbElementService,
    AnnotationService, EventStreamService, JouleService];
export {
  NilmService, DbFolderService, DbStreamService, SessionService,
  DataService, MessageService, PermissionService, UserGroupService, UserService,
  ColorService, DbElementService, DataViewService, AnnotationService, EventStreamService, JouleService
};
