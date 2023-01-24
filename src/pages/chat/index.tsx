import Head from "next/head";
import { Box, Button, Heading, HStack, Img, Input, InputGroup, InputRightElement, VStack, Text, StackDivider, useToast, CircularProgress } from "@chakra-ui/react";
import { AiFillPlusCircle } from "react-icons/ai";
import { FaTelegramPlane } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import io, { Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export interface ILoggedInData {
  connected?: boolean;
  username: string;
  token: string;
}

interface IMessage {
  content: string;
  fromSelf: boolean;
}

export interface IUserData {
  username: string;
  userID: string;
  connected: boolean;
}

export interface IUser extends IUserData {
  messages: Array<IMessage>;
  hasNewMessages: boolean;
  self: boolean;
}

declare module "socket.io-client" {
  interface Socket {
    userID: string;
  }
}

let socket: Socket;

export default function Chat() {
  const toast = useToast();
  const [csr, setCsr] = useState(false);
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<ILoggedInData>();
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    const loadUser = localStorage.getItem("user");
    if (loadUser) setLoggedInUser(JSON.parse(loadUser)), setCsr(true);
    else router.push("/login");

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (csr) socketInitializer();
  }, [csr]);

  const initReactiveProperties = () => ({
    messages: [],
    hasNewMessages: false,
  });

  async function socketInitializer() {
    socket = io("http://localhost:4040", { autoConnect: false });
    socket.auth = {
      sessionID: loggedInUser?.token,
      username: loggedInUser?.username,
    };
    socket.connect();

    socket.on("connect", () => {
      toast({
        title: "Notification.",
        // another pending description: "User with name \"lorem\" has been logged out"?
        description: "Connection to websocket server has been established.",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      setLoggedInUser((user) => user && { ...user, connected: true });
    });

    socket.on("session", ({ sessionID, userID }: Record<string, string>) => {
      socket.auth = { sessionID, username: loggedInUser?.username };
      socket.userID = userID;
    });

    socket.onAny((event, ...args) => {
      console.log(event, args);
    });

    socket.on("disconnect", () => {
      setLoggedInUser((user) => user && { ...user, connected: false });
    });

    socket.on("user disconnected", (id) => {
      setUsers((currUsers) => {
        return currUsers.map((user) => {
          if (user.userID === id) return { ...user, connected: false };
          else return user;
        });
      });
    });

    socket.on("user connected", (incomingUser: IUserData) => {
      setUsers((currUsers) => {
        const hasBeenAdded = currUsers.findIndex((currUser) => currUser.userID === incomingUser.userID);

        return hasBeenAdded >= 0
          ? currUsers.map((currUser, i) => (i === hasBeenAdded ? { ...currUser, connected: true } : currUser))
          : [
              ...currUsers,
              {
                ...incomingUser,
                ...initReactiveProperties(),
                self: false,
              },
            ];
      });
    });
    socket.on("users", (fetchedUsers: IUser[]) => {
      setUsers((currUsers) => {
        let hasBeenAdded = -1;
        const condition = hasBeenAdded >= 0;
        fetchedUsers = fetchedUsers.map((user) => {
          hasBeenAdded = currUsers.findIndex((currUser) => currUser.userID === user.userID);

          return {
            ...user,
            ...initReactiveProperties(),
            self: user.userID === socket.userID,
          };
        });
        return condition ? currUsers.map((currUser, i) => (i === hasBeenAdded ? { ...currUser, connected: true } : currUser)) : fetchedUsers;
      });
    });

    socket.on("private message", ({ content, from, to }: Record<string, string>) => {
      setUsers((currUsers) => {
        return currUsers.map((user) => {
          const fromSelf = socket.userID === from;

          if (user.userID === (fromSelf ? to : from)) {
            user.messages = [
              ...user.messages,
              {
                content,
                fromSelf,
              },
            ];

            if (user.userID !== selectedChat) user.hasNewMessages = true;
            return user;
          }
          return user;
        });
      });
    });

    socket.on("connect_error", (err) => {
      console.error(err);
      toast({
        title: "Notification.",
        description: "Connection lost. Please try again later.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    });
  }

  const sendMessage = () => {
    socket.emit("private message", {
      content: message,
      to: selectedChat,
    });
    setUsers((currUsers) => [
      ...currUsers.map((user) => {
        if (user.userID === selectedChat) {
          return {
            ...user,
            messages: [
              ...user.messages,
              {
                content: message,
                fromSelf: true,
              },
            ],
          };
        }
        return user;
      }),
    ]);
    setMessage("");
  };

  const handleKeypress: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && message) {
      e.preventDefault();
      sendMessage();
    }
  };
  const handleSubmitText: React.MouseEventHandler<SVGElement> = (e) => {
    if (message) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Head>
        <title>FaSock chat-app</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HStack spacing="0" alignItems="stretch" maxH="full" h="100vh" overflow="hidden" divider={<StackDivider borderColor="#2C323D" />}>
        <VStack spacing="0" as="nav" w="md" alignItems="stretch">
          <HStack p="3" gap="1" justifyContent="space-between">
            <HStack>
              <Img src="/profile.jpg" width={45} height={45} borderRadius="full" />
              <VStack spacing="0" alignItems="start">
                <Heading fontSize="lg">{loggedInUser?.username ?? "Unauthenticated"}</Heading>
                <Text>{loggedInUser?.connected ? "Online" : "Offline"}</Text>
              </VStack>
            </HStack>
            <BsThreeDotsVertical cursor="pointer" />
          </HStack>
          <Button rightIcon={<AiFillPlusCircle />} py="4" rounded="none" fontSize="lg">
            Create New Group
          </Button>
          <VStack spacing="0" divider={<StackDivider borderColor="#2C323D" />} alignItems="stretch" overflow="auto">
            {users
              ?.filter((user) => !user.self)
              .map((user, i) =>
                selectedChat === user.userID ? (
                  <Box key={user.userID} display="flex" alignItems="start" justifyContent="space-between" px="5" py="3" gap="3" bg="#2b3942">
                    <Img src="user.jpg" w={45} borderRadius="full" />
                    <VStack flex={1} alignItems="start" spacing="0">
                      <Heading fontSize="lg">
                        <CircularProgress value={100} color={`${user.connected ? "green" : "red"}.400`} size="15px" thickness="30px" /> {user.username}
                      </Heading>
                      <Text>
                        {user.messages.slice().pop()?.content} {user.hasNewMessages && "- !"}
                      </Text>
                    </VStack>
                    {/* last message timestamp */}
                    <Text alignSelf="start">10.45</Text>
                  </Box>
                ) : (
                  <Box
                    key={user.userID}
                    display="flex"
                    alignItems="center"
                    px="5"
                    py="3"
                    gap="3"
                    _hover={{ bg: "#2c323d", borderY: "1px", borderColor: "#1a202c", cursor: "pointer" }}
                    onClick={() => {
                      setSelectedChat(user.userID);
                      setUsers((currUsers) =>
                        currUsers.map((currUser) =>
                          currUser.userID === user.userID
                            ? {
                                ...currUser,
                                hasNewMessages: false,
                              }
                            : currUser
                        )
                      );
                    }}
                  >
                    <Img src="user.jpg" w={45} borderRadius="full" />
                    <Heading fontSize="lg">
                      <CircularProgress value={100} color={`${user.connected ? "green" : "red"}.400`} size="15px" thickness="30px" /> {user.username} {user.hasNewMessages && "- !"}
                    </Heading>
                  </Box>
                )
              )}
          </VStack>
        </VStack>
        {selectedChat ? (
          <VStack spacing="0" flexGrow={1} pb="1" alignItems="stretch">
            <HStack p="3" gap="1">
              <Img src="user.jpg" width={45} height={45} borderRadius="full" />
              <Heading fontSize="lg">{users.find((user) => user.userID === selectedChat)?.username}</Heading>
            </HStack>
            <VStack bg="#2C323D" flex={1} p="5" overflow="auto">
              {users
                .find((user) => user.userID === selectedChat)
                ?.messages.map((message, i) => {
                  return (
                    <Text key={i} bg="ThreeDDarkShadow" rounded="md" p="2" alignSelf={message.fromSelf ? "end" : "start"} maxW="45%">
                      {message.content}
                    </Text>
                  );
                })}
            </VStack>
            <InputGroup>
              <Input px="3" variant="flushed" placeholder="Enter new message..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeypress} />
              <InputRightElement cursor="pointer" children={<FaTelegramPlane onClick={handleSubmitText} />} />
            </InputGroup>
          </VStack>
        ) : (
          <VStack flexGrow={1} pb="1" alignItems="center" justifyContent="center" direction="row">
            <Box>
              <Heading>Select chat-box to start new conversation!</Heading>
            </Box>
          </VStack>
        )}
      </HStack>
    </>
  );
}
