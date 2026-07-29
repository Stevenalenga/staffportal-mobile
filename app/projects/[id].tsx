import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  projectsApi,
  type ProjectComment,
  type ProjectMember,
  type ProjectUpdate,
} from "@/lib/api";
import {
  formatDate,
  formatRoleLabel,
  getInitials,
  getProjectStatusStyle,
  getRoleColor,
} from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

function MemberRow({ member }: { member: ProjectMember }) {
  const name = member.user.name ?? member.user.email;
  const roleColor = getRoleColor(member.user.role);

  return (
    <View className="flex-row items-center gap-3 py-2.5 border-b border-gray-50">
      <View
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: `${roleColor}20` }}
      >
        <Text className="text-xs font-bold" style={{ color: roleColor }}>
          {getInitials(name)}
        </Text>
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-xs text-gray-400" numberOfLines={1}>
          {member.user.email}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-xs font-medium text-emerald-700">
          {member.role}
        </Text>
        <Text className="text-xs text-gray-400">
          {formatRoleLabel(member.user.role)}
        </Text>
      </View>
    </View>
  );
}

function CommentRow({ comment }: { comment: ProjectComment }) {
  return (
    <View className="bg-gray-50 rounded-xl px-3 py-2 mt-2">
      <View className="flex-row items-center justify-between mb-0.5">
        <Text className="text-xs font-medium text-gray-700">
          {comment.author.name ?? comment.author.email}
        </Text>
        <Text className="text-xs text-gray-400">
          {formatDate(comment.createdAt)}
        </Text>
      </View>
      <Text className="text-xs text-gray-600">{comment.body}</Text>
    </View>
  );
}

function UpdateCard({
  update,
  projectId,
  canComment,
  onCommented,
}: {
  update: ProjectUpdate;
  projectId: string;
  canComment: boolean;
  onCommented: () => void;
}) {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const commentMutation = useMutation({
    mutationFn: () =>
      projectsApi.addComment(projectId, update.id, { body: body.trim() }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      onCommented();
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert(
        "Comment Failed",
        e?.response?.data?.error ?? e?.message ?? "Could not add comment."
      );
    },
  });

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <View className="flex-row items-start justify-between mb-1">
        <View className="flex-1 mr-2">
          {update.title ? (
            <Text className="font-semibold text-gray-900 text-sm">
              {update.title}
            </Text>
          ) : null}
          <Text className="text-xs text-gray-400 mt-0.5">
            {update.author.name ?? update.author.email} ·{" "}
            {formatDate(update.createdAt)}
          </Text>
        </View>
      </View>
      <Text className="text-sm text-gray-700 mt-2">{update.body}</Text>

      {update.comments.length > 0 && (
        <View className="mt-3">
          <Text className="text-xs font-medium text-gray-500 mb-1">
            Comments ({update.comments.length})
          </Text>
          {update.comments.map((c) => (
            <CommentRow key={c.id} comment={c} />
          ))}
        </View>
      )}

      {canComment && (
        <View className="flex-row items-center gap-2 mt-3">
          <TextInput
            className="flex-1 border border-gray-200 rounded-xl px-3 h-10 text-sm text-gray-900 bg-gray-50"
            placeholder="Add a comment…"
            placeholderTextColor="#9ca3af"
            value={body}
            onChangeText={setBody}
          />
          <TouchableOpacity
            onPress={() => {
              if (!body.trim()) return;
              commentMutation.mutate();
            }}
            disabled={commentMutation.isPending || !body.trim()}
            className={`bg-emerald-700 rounded-xl w-10 h-10 items-center justify-center ${
              commentMutation.isPending || !body.trim() ? "opacity-50" : ""
            }`}
          >
            {commentMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={16} color="white" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [inviteEmail, setInviteEmail] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");

  const {
    data: project,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  });

  useFocusEffect(
    useCallback(() => {
      if (id) refetch();
    }, [id, refetch])
  );

  const inviteMutation = useMutation({
    mutationFn: (email: string) => projectsApi.addMember(id!, email),
    onSuccess: () => {
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      Alert.alert("Invited", "Member added to the project.");
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert(
        "Invite Failed",
        e?.response?.data?.error ?? e?.message ?? "Could not add member."
      );
    },
  });

  const postUpdateMutation = useMutation({
    mutationFn: () =>
      projectsApi.postUpdate(id!, {
        title: updateTitle.trim() || undefined,
        body: updateBody.trim(),
      }),
    onSuccess: () => {
      setUpdateTitle("");
      setUpdateBody("");
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert(
        "Post Failed",
        e?.response?.data?.error ?? e?.message ?? "Could not post update."
      );
    },
  });

  if (isLoading || !project) {
    return (
      <SafeAreaView
        className="flex-1 bg-gray-50"
        edges={["top", "left", "right"]}
      >
        <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={18} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Project</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      </SafeAreaView>
    );
  }

  const status = getProjectStatusStyle(project.status);
  const postingBlocked = ["COMPLETED", "CANCELLED"].includes(project.status);
  const canInteract = !!user;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1 min-w-0">
          <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
            {project.name}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5 font-mono">
            {project.code}
          </Text>
        </View>
        <View
          className="rounded-full px-2 py-0.5"
          style={{ backgroundColor: status.bg }}
        >
          <Text className="text-xs font-medium" style={{ color: status.color }}>
            {status.label}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#047857"
            />
          }
        >
          <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
            {project.description ? (
              <Text className="text-sm text-gray-700 mb-3">
                {project.description}
              </Text>
            ) : (
              <Text className="text-sm text-gray-400 mb-3 italic">
                No description
              </Text>
            )}

            <View className="gap-2">
              {project.funder ? (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="business-outline" size={14} color="#9ca3af" />
                  <Text className="text-xs text-gray-600">
                    Funder: {project.funder}
                  </Text>
                </View>
              ) : null}
              {(project.startDate || project.endDate) && (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                  <Text className="text-xs text-gray-600">
                    {project.startDate
                      ? formatDate(project.startDate)
                      : "—"}{" "}
                    →{" "}
                    {project.endDate ? formatDate(project.endDate) : "—"}
                  </Text>
                </View>
              )}
            </View>

            {project.objectives ? (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-xs font-medium text-gray-500 mb-1">
                  Objectives
                </Text>
                <Text className="text-sm text-gray-700">
                  {project.objectives}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Members */}
          <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              Members ({project.members.length})
            </Text>
            {project.members.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}

            {project.isAdmin && (
              <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <TextInput
                  className="flex-1 border border-gray-200 rounded-xl px-3 h-10 text-sm text-gray-900 bg-gray-50"
                  placeholder="colleague@email.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                />
                <TouchableOpacity
                  onPress={() => {
                    const email = inviteEmail.trim().toLowerCase();
                    if (!email) return;
                    inviteMutation.mutate(email);
                  }}
                  disabled={inviteMutation.isPending || !inviteEmail.trim()}
                  className={`bg-emerald-700 rounded-xl px-3 h-10 items-center justify-center ${
                    inviteMutation.isPending || !inviteEmail.trim()
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  {inviteMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white text-sm font-medium">
                      Invite
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Post update */}
          <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              Post Update
            </Text>
            {postingBlocked ? (
              <Text className="text-xs text-gray-500">
                Updates are disabled for {status.label.toLowerCase()} projects.
              </Text>
            ) : (
              <>
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 h-10 text-sm text-gray-900 bg-gray-50 mb-2"
                  placeholder="Title (optional)"
                  placeholderTextColor="#9ca3af"
                  value={updateTitle}
                  onChangeText={setUpdateTitle}
                />
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 bg-gray-50 min-h-[72px] mb-3"
                  placeholder="What's the latest? *"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  value={updateBody}
                  onChangeText={setUpdateBody}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (!updateBody.trim()) {
                      Alert.alert("Required", "Update body is required.");
                      return;
                    }
                    postUpdateMutation.mutate();
                  }}
                  disabled={postUpdateMutation.isPending || !updateBody.trim()}
                  className={`bg-emerald-700 rounded-xl h-10 items-center justify-center flex-row gap-1.5 ${
                    postUpdateMutation.isPending || !updateBody.trim()
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  {postUpdateMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="create-outline" size={16} color="white" />
                      <Text className="text-white text-sm font-medium">
                        Post Update
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Updates feed */}
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            Updates ({project.updates.length})
          </Text>
          {project.updates.length === 0 ? (
            <View className="items-center py-10">
              <Ionicons name="chatbubbles-outline" size={40} color="#d1d5db" />
              <Text className="text-gray-400 text-sm mt-2">No updates yet</Text>
            </View>
          ) : (
            project.updates.map((u) => (
              <UpdateCard
                key={u.id}
                update={u}
                projectId={project.id}
                canComment={canInteract && !postingBlocked}
                onCommented={() => refetch()}
              />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
