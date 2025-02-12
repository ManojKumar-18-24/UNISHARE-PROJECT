import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import service from "../appwrite/config";
import { Button, Container } from "../components";
import { useSelector } from "react-redux";
import conf from "../conf/conf";

export default function Post() {
  const [post, setPost] = useState(null);
  const [request, setRequest] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const { userData } = useSelector((state) => state.userData);

  const isAuthor = post && userData ? post.userId === userData.$id : false;

  useEffect(() => {
    if (id) {
      service.getPost(id).then((post) => {
        if (post) setPost(post);
        else navigate("/");
      });
      console.log("in post.jsx:", userData);
      
    } else navigate("/");

    const Booked = async() =>{
      
      const userId = userData.$id;
      const postId = id; 

      let notification = await service.findNotification(userId,postId)

      if(notification.documents.length > 0 ){
        setRequest(true)
      }
    }

    Booked()
  }, [userData, id, navigate]);

  const triggerNotification = async () => {
    const userId = userData.$id;
    const postId = id;

    let notification = await service.findNotification(userId, postId);

    if (notification.documents.length == 0) {
      // Create notification if not found
      const owner = post.userId;
      const tenant = userData.$id;
      const post_id = post.$id;

      console.log(owner,tenant,post_id)
      try {
        let newNotification = await service.createNotification(
         { owner,
          tenant,
          post_id}
        );
        if (newNotification) {
          setRequest(true);
        }
      } catch (createError) {
        console.error("Error creating notification:", createError);
      }
    }
  };

  const deletePost = () => {
    service.deletePost(post.$id).then((status) => {
      if (status) {
        service.deleteFile(post.image); // Deletes the associated image file
        navigate("/");
      }
    });
  };

  return post ? (
    <div className="py-8">
      <Container>
        {/* Image Section */}
        <div className="w-full flex justify-center mb-4 relative border rounded-xl p-2">
          <img
            src={service.getFilePreview(post.image)} // Displaying the uploaded image
            alt={post.title}
            className="rounded-xl"
            height="400px"
            width="400px"
          />
          {isAuthor ? (
            <div className="absolute right-6 top-6">
              <Link to={`/edit-post/${post.$id}`}>
                <Button bgColor="bg-green-500" className="mr-3">
                  Edit
                </Button>
              </Link>
              <Button bgColor="bg-red-500" onClick={deletePost}>
                Delete
              </Button>
            </div>
          ) : (
            <div className="absolute right-6 top-6">
              <Button bgColor="bg-red-500" onClick={triggerNotification}>
                {request ? "Requested" : "Book"}
              </Button>
            </div>
          )}
        </div>

        {/* Post Details */}
        <div className="w-full mb-6">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <p className="text-gray-600">Model: {post.model}</p>
          <p className="text-gray-600">
            From: {new Date(post.starting_time).toLocaleString()}
          </p>
          <p className="text-gray-600">
            To: {new Date(post.ending_time).toLocaleString()}
          </p>
          <p className="text-gray-600">Price: ${post.price}</p>
        </div>
      </Container>
    </div>
  ) : null;
}
