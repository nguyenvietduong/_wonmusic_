import { SigninForm } from '@/components/auth/signin-form'
import SEO from '@/components/frontend/SEO'

const SigninPage = () => {
  return (
    <>
      <SEO
        title="Đăng Nhập – Won Music"
        description="Đăng nhập vào Won Music để nghe nhạc không giới hạn, theo dõi nghệ sĩ yêu thích và khám phá âm nhạc mới nhất."
        canonical="https://www.wonmusic.vn/signin"
        robots="noindex, follow"
      />
      <SigninForm />
    </>

  )
}

export default SigninPage