import { GetStaticProps } from "next"
import Header from "../../components/Header"
import { sanityClient, urlFor } from "../../sanity"
import { Post } from "../../typing"
import PortableText from "react-portable-text";
import Head from "next/head";
import { useForm, SubmitHandler } from "react-hook-form"

interface Props {
    post : Post;
}

interface CommentForm {
    _id : string;
    name : string;
    email : string;
    comment : string;
}

function DetailPost({post} : Props) {

    const { register, handleSubmit, formState : { errors }} = useForm();
    const onSubmit : SubmitHandler<CommentForm> = async (data) => {
        await fetch('/api/createComment', {
            method : 'POST',
            body : JSON.stringify(data)
        }).then(() => {
            console.log(data);
        }).catch((err) => {
            console.log(err)
        })
    }

    return (
        <>
            <Head>
                <title>Medium 2.0</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className="">
                <img className="w-full h-96 object-cover" src={urlFor(post.mainImage).url()!} alt={post.title} />

                <article className="max-w-3xl mx-auto p-3">
                    <h1 className="text-3xl mt-5 mb-3 font-bold">{post.title}</h1>
                    <h2 className="text-xl font-light text-gray-500 mb-2 italic">{post.description}</h2>

                    <div className="flex items-center space-x-3">
                        <img className="h-10 w-10 rounded-full" src={urlFor(post.author.image).url()!} alt={post.author.name} />
                        <p className="font-extralight text-sm">Blog post by <span className="text-green-600 font-medium">{post.author.name}</span> - Published at {post._createdAt}</p>
                    </div>

                    <div className="my-5">
                        <PortableText content={post.body} dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!} projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!} className="" serializers={
                            {
                                h1 : (props : any) => (
                                    <h1 className="text-2xl font-bold my-5"{...props} />
                                ),
                                h2 : (props : any) => (
                                    <h1 className="text-xl font-bold my-5"{...props} />
                                ),
                                li : ({children} : any) => (
                                    <li className="ml-5 list-disc">{children}</li>
                                ),
                                link : ({href, children} : any) => (
                                    <a href={href} className="text-blue-500 hover:underline">
                                        {children}
                                    </a>
                                ),
                                normal : (props : any) => (
                                    <p className="mb-3" {...props} />
                                )
                            }
                        } />
                    </div>
                </article>

                <hr className="max-w-lg my-5 mx-auto border border-green-600" />

                <form className="flex flex-col p-10 my-10 max-w-2xl mx-auto mb-10" onSubmit={handleSubmit(onSubmit)}>
                    <h3 className="text-sm text-green-600">Enjoyed the article?</h3>
                    <h4 className="text-3xl font-bold">Leave a comment below!</h4>
                    <hr className="py-3 mt-2" />

                    <input {...register("_id")} type="hidden" name="_id" value={post._id} />

                    <label className="block mb-5">
                        <span className="text-gray-700">Name</span>
                        <input {...register("name", { required : true })} className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-green-600 focus:outline-none focus:border-green-600 transition duration-200 ease-in-out" type="text" placeholder="John Doe" />
                        { errors.name && (<span className="mt-2 block text-red-500 italic">*The Name field is required</span>)}
                    </label>
                    <label className="block mb-5">
                        <span className="text-gray-700">Email</span>
                        <input {...register("email", { required : true })} className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-green-600 focus:outline-none focus:border-green-600 transition duration-200 ease-in-out" type="email" placeholder="your@email.com" />
                        { errors.name && (<span className="mt-2 block text-red-500 italic">*The Name field is required</span>)}
                    </label>
                    <label className="block mb-5">
                        <span className="text-gray-700">Comment</span>
                        <textarea {...register("comment", { required : true })} className="shadow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-green-600 focus:outline-none focus:border-green-600 transition duration-200 ease-in-out resize-none" rows={8} placeholder="Tell about the article" />
                        { errors.name && (<span className="mt-2 block text-red-500 italic">*The Name field is required</span>)}
                    </label>
                    <button type="submit" className="w-full bg-green-600 text-white rounded py-2 hover:opacity-80 hover:shadow focus:outline-none transition-opacity duration-200 ease-in-out">Submit</button>
                </form>
            </main>
        </>
        
    )
}

export default DetailPost

export const getStaticPaths = async () => {
    const query = `*[_type == "post"]{
        _id,
        slug {
            current
        }
      }`
    const posts = await sanityClient.fetch(query);
    const paths = posts.map((post : Post) => ({
        params : {
            slug : post.slug.current
        }
    }));

    return {
        paths,
        fallback : 'blocking'
    }
}

export const getStaticProps : GetStaticProps = async ({params}) => {
    const query = `*[_type == "post" && slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author -> {
            name,
            image
        },
        description,
        mainImage,
        slug,
        body
      }`

      const post = await sanityClient.fetch(query, {
        slug : params?.slug
      });
      
      post._createdAt = new Date(post._createdAt).toLocaleString();

      if(!post){
        return {
            notFound : true
        }
      }

      return {
        props : {
            post,
        },
      }
}