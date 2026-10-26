import {
  CreateLabel,
  DeleteLabel,
  ListLabels,
  UpdateLabel,
} from "@/core/application/use-cases/labels";
import {
  AssignRole,
  DeleteRoleAssignment,
  ListSongRoles,
  ListUserRoles,
  UpdateInstrumentName,
  UpdateRoleAssignment,
} from "@/core/application/use-cases/roles";
import {
  CreateSong,
  DeleteSong,
  GetSong,
  GetSongLabels,
  ListSongs,
  SetSongLabels,
  UpdateSong,
} from "@/core/application/use-cases/songs";
import {
  CreateUser,
  DeleteUser,
  ListUsers,
  LoginUser,
  UpdateUser,
} from "@/core/application/use-cases/users";
import { SearchYouTube } from "@/core/application/use-cases/youtube";
import { JoseJwtTokenService } from "./auth/JoseJwtTokenService";
import { WebCryptoPasswordHasher } from "./auth/WebCryptoPasswordHasher";
import { type Db, type DbEnv, getDb } from "./db/client";
import type { AppEnv } from "./env";
import { DrizzleLabelRepository } from "./repositories/DrizzleLabelRepository";
import { DrizzleRoleAssignmentRepository } from "./repositories/DrizzleRoleAssignmentRepository";
import { DrizzleSongRepository } from "./repositories/DrizzleSongRepository";
import { DrizzleUserRepository } from "./repositories/DrizzleUserRepository";
import { MockYouTubeAdapter } from "./youtube/MockYouTubeAdapter";
import { YouTubeApiAdapter } from "./youtube/YouTubeApiAdapter";

export interface Container {
  db: Db;
  save: () => void;
  users: DrizzleUserRepository;
  songs: DrizzleSongRepository;
  roles: DrizzleRoleAssignmentRepository;
  labels: DrizzleLabelRepository;
  hasher: WebCryptoPasswordHasher;
  tokens: JoseJwtTokenService;
  loginUser: LoginUser;
  listUsers: ListUsers;
  createUser: CreateUser;
  updateUser: UpdateUser;
  deleteUser: DeleteUser;
  getSong: GetSong;
  listSongs: ListSongs;
  createSong: CreateSong;
  updateSong: UpdateSong;
  deleteSong: DeleteSong;
  getSongLabels: GetSongLabels;
  setSongLabels: SetSongLabels;
  assignRole: AssignRole;
  updateRoleAssignment: UpdateRoleAssignment;
  updateInstrumentName: UpdateInstrumentName;
  deleteRoleAssignment: DeleteRoleAssignment;
  listSongRoles: ListSongRoles;
  listUserRoles: ListUserRoles;
  listLabels: ListLabels;
  createLabel: CreateLabel;
  updateLabel: UpdateLabel;
  deleteLabel: DeleteLabel;
  searchYouTube: SearchYouTube;
}

export async function getContainer(env: AppEnv): Promise<Container> {
  const dbEnv: DbEnv = { SQLITE_FILE: env.SQLITE_FILE };
  if (env.DB !== undefined) {
    dbEnv.DB = env.DB as DbEnv["DB"];
  }
  const { db, save } = await getDb(dbEnv);
  const users = new DrizzleUserRepository(db);
  const songs = new DrizzleSongRepository(db);
  const roles = new DrizzleRoleAssignmentRepository(db);
  const labels = new DrizzleLabelRepository(db);
  const hasher = new WebCryptoPasswordHasher();
  const tokens = new JoseJwtTokenService(env.JWT_SECRET);
  const youtube =
    env.YOUTUBE_API_KEY && env.YOUTUBE_API_KEY.length > 0
      ? new YouTubeApiAdapter(env.YOUTUBE_API_KEY)
      : new MockYouTubeAdapter();
  return {
    db,
    save,
    users,
    songs,
    roles,
    labels,
    hasher,
    tokens,
    loginUser: new LoginUser(users, hasher),
    listUsers: new ListUsers(users),
    createUser: new CreateUser(users, hasher),
    updateUser: new UpdateUser(users, hasher),
    deleteUser: new DeleteUser(users),
    getSong: new GetSong(songs),
    listSongs: new ListSongs(songs),
    createSong: new CreateSong(songs),
    updateSong: new UpdateSong(songs),
    deleteSong: new DeleteSong(songs),
    getSongLabels: new GetSongLabels(labels),
    setSongLabels: new SetSongLabels(labels),
    assignRole: new AssignRole(roles, songs, users),
    updateRoleAssignment: new UpdateRoleAssignment(roles),
    updateInstrumentName: new UpdateInstrumentName(roles),
    deleteRoleAssignment: new DeleteRoleAssignment(roles),
    listSongRoles: new ListSongRoles(roles),
    listUserRoles: new ListUserRoles(roles),
    listLabels: new ListLabels(labels),
    createLabel: new CreateLabel(labels),
    updateLabel: new UpdateLabel(labels),
    deleteLabel: new DeleteLabel(labels),
    searchYouTube: new SearchYouTube(youtube),
  };
}
